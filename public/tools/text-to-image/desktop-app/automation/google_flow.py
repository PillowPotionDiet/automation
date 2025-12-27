"""
Google Flow (ImageFX) Automation
Browser automation for image generation using Google's ImageFX
"""

import os
import time
import base64
import requests
from pathlib import Path
from datetime import datetime
from typing import Callable, Optional, List, Dict, Any

try:
    from selenium.webdriver.common.by import By
    from selenium.webdriver.common.keys import Keys
    from selenium.webdriver.support.ui import WebDriverWait
    from selenium.webdriver.support import expected_conditions as EC
    from selenium.common.exceptions import TimeoutException, NoSuchElementException
except ImportError:
    pass

from automation.browser import BrowserDriver


# URLs
GOOGLE_LOGIN_URL = "https://accounts.google.com/signin"
IMAGEFX_URL = "https://labs.google/fx/tools/image-fx"


class GoogleFlowAutomation:
    """Automation for Google Flow ImageFX"""

    def __init__(
        self,
        email: str = "",
        password: str = "",
        manual_login: bool = False,
        headless: bool = False,
        timeout: int = 120,
        delay: int = 5,
        output_dir: Optional[Path] = None,
        log_callback: Optional[Callable[[str], None]] = None,
        progress_callback: Optional[Callable[[int, int, str], None]] = None
    ):
        self.email = email
        self.password = password
        self.manual_login = manual_login
        self.headless = headless
        self.timeout = timeout
        self.delay = delay
        self.output_dir = output_dir or Path("output/images")
        self.log_callback = log_callback
        self.progress_callback = progress_callback

        self.browser: Optional[BrowserDriver] = None

        # Ensure output directory exists
        self.output_dir.mkdir(parents=True, exist_ok=True)

    def log(self, message: str):
        """Log a message"""
        if self.log_callback:
            self.log_callback(message)
        else:
            print(f"[LOG] {message}")

    def update_progress(self, current: int, total: int, prompt: str = ""):
        """Update progress"""
        if self.progress_callback:
            self.progress_callback(current, total, prompt)

    def generate_images(
        self,
        prompts: List[str],
        stop_check: Optional[Callable[[], bool]] = None
    ) -> List[Dict[str, Any]]:
        """Generate images from prompts"""
        results = []

        try:
            # Initialize browser
            self.log("Starting browser...")
            self.browser = BrowserDriver(
                headless=self.headless,
                download_dir=self.output_dir
            )
            self.browser.create()

            # Login to Google
            self.log("Logging into Google...")
            if not self._login():
                self.log("Login failed!")
                return results

            # Navigate to ImageFX
            self.log("Navigating to ImageFX...")
            if not self._navigate_to_imagefx():
                self.log("Failed to load ImageFX!")
                return results

            # Process each prompt
            total = len(prompts)
            for i, prompt in enumerate(prompts):
                # Check if stop requested
                if stop_check and stop_check():
                    self.log("Generation stopped by user")
                    break

                self.update_progress(i, total, prompt)
                self.log(f"Processing prompt {i + 1}/{total}...")

                # Generate image
                result = self._generate_single(prompt)
                if result:
                    results.append(result)
                    self.log(f"Image saved: {result.get('file', 'unknown')}")
                else:
                    self.log(f"Failed to generate image for prompt {i + 1}")

                # Delay between prompts
                if i < total - 1:
                    self.log(f"Waiting {self.delay}s before next prompt...")
                    time.sleep(self.delay)

            self.update_progress(total, total, "Complete!")

        except Exception as e:
            self.log(f"Error: {str(e)}")

        finally:
            if self.browser:
                self.log("Closing browser...")
                self.browser.quit()

        return results

    def _login(self) -> bool:
        """Login to Google account"""
        if self.manual_login:
            return self._login_manual()
        else:
            return self._login_auto()

    def _login_auto(self) -> bool:
        """Automatic login with credentials"""
        if not self.email or not self.password:
            self.log("No credentials provided, switching to manual login")
            return self._login_manual()

        self.log("Auto login with credentials...")
        driver = self.browser.driver

        driver.get(GOOGLE_LOGIN_URL)
        time.sleep(2)

        try:
            # Enter email
            self.log("Entering email...")
            email_input = WebDriverWait(driver, self.timeout).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, "input[type='email']"))
            )
            email_input.clear()
            email_input.send_keys(self.email)
            email_input.send_keys(Keys.RETURN)
            time.sleep(3)

            # Enter password
            self.log("Entering password...")
            password_input = WebDriverWait(driver, self.timeout).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, "input[type='password']"))
            )
            password_input.clear()
            password_input.send_keys(self.password)
            password_input.send_keys(Keys.RETURN)
            time.sleep(3)

            # Check for 2FA
            self.log("Checking for 2FA...")
            time.sleep(5)

            current_url = driver.current_url
            if "challenge" in current_url or "signin" in current_url:
                self.log("2FA required - please complete verification in browser...")
                return self._wait_for_2fa()

            self.log("Login successful!")
            return True

        except TimeoutException:
            self.log("Login timeout - check credentials")
            return False
        except Exception as e:
            self.log(f"Login error: {str(e)}")
            return False

    def _login_manual(self) -> bool:
        """Manual login - user enters credentials in browser"""
        self.log("Manual login mode - please login in the browser...")
        driver = self.browser.driver

        driver.get(GOOGLE_LOGIN_URL)

        # Wait for user to complete login
        start_time = time.time()
        timeout = 300  # 5 minutes for manual login

        while time.time() - start_time < timeout:
            current_url = driver.current_url

            # Check if logged in
            if "myaccount.google.com" in current_url:
                self.log("Login successful!")
                return True

            # Check if on any Google service (logged in)
            if "google.com" in current_url and "signin" not in current_url and "accounts" not in current_url:
                driver.get(IMAGEFX_URL)
                time.sleep(3)
                if "signin" not in driver.current_url:
                    self.log("Login successful!")
                    return True
                driver.get(GOOGLE_LOGIN_URL)

            elapsed = int(time.time() - start_time)
            if elapsed % 30 == 0 and elapsed > 0:
                self.log(f"Waiting for login... {timeout - elapsed}s remaining")

            time.sleep(2)

        self.log("Login timeout")
        return False

    def _wait_for_2fa(self) -> bool:
        """Wait for user to complete 2FA"""
        driver = self.browser.driver
        tfa_timeout = 180  # 3 minutes

        # Detect 2FA type
        tfa_type = self._detect_2fa_type()
        self.log(f"2FA type detected: {tfa_type or 'unknown'}")

        for i in range(tfa_timeout):
            time.sleep(1)
            current = driver.current_url

            # Check if login completed
            if "myaccount" in current or "labs.google" in current:
                if "signin" not in current and "challenge" not in current:
                    self.log("2FA verification successful!")
                    return True

            # Check if on any Google service
            if "google.com" in current:
                if "signin" not in current and "challenge" not in current and "accounts" not in current:
                    self.log("2FA verification successful!")
                    return True

            if i % 15 == 0 and i > 0:
                remaining = tfa_timeout - i
                self.log(f"Waiting for 2FA... {remaining}s remaining")

        self.log("2FA timeout")
        return False

    def _detect_2fa_type(self) -> Optional[str]:
        """Detect 2FA verification type"""
        try:
            page_source = self.browser.driver.page_source.lower()
            current_url = self.browser.driver.current_url.lower()

            if "authenticator" in page_source or "verification code" in page_source:
                return "authenticator"
            elif "phone" in page_source and ("text" in page_source or "sms" in page_source):
                return "sms"
            elif "security key" in page_source:
                return "security_key"
            elif "google prompt" in page_source or "tap yes" in page_source:
                return "google_prompt"
            elif "challenge" in current_url:
                return "unknown"
        except Exception:
            pass

        return None

    def _navigate_to_imagefx(self) -> bool:
        """Navigate to ImageFX"""
        driver = self.browser.driver

        driver.get(IMAGEFX_URL)
        time.sleep(5)

        try:
            # Wait for prompt input
            WebDriverWait(driver, self.timeout).until(
                EC.presence_of_element_located((
                    By.CSS_SELECTOR,
                    "textarea, input[type='text'], [contenteditable='true']"
                ))
            )
            self.log("ImageFX loaded successfully!")
            return True
        except TimeoutException:
            self.log("Page loaded, continuing...")
            return True

    def _generate_single(self, prompt: str) -> Optional[Dict[str, Any]]:
        """Generate a single image from prompt"""
        driver = self.browser.driver

        try:
            # Find prompt input
            prompt_input = self._find_prompt_input()
            if not prompt_input:
                self.log("Could not find prompt input")
                return None

            # Clear and enter prompt
            prompt_input.clear()
            time.sleep(0.5)
            prompt_input.send_keys(prompt)
            time.sleep(1)

            # Find and click generate button
            generate_btn = self._find_generate_button()
            if generate_btn:
                generate_btn.click()
            else:
                prompt_input.send_keys(Keys.RETURN)

            time.sleep(2)

            # Wait for image
            images = self._wait_for_images()
            if not images:
                return None

            # Download first image
            filepath = self._download_image(images[0], prompt)
            if filepath:
                return {
                    "prompt": prompt,
                    "file": str(filepath),
                    "timestamp": datetime.now().isoformat()
                }

        except Exception as e:
            self.log(f"Generation error: {str(e)}")

        return None

    def _find_prompt_input(self):
        """Find the prompt input field"""
        selectors = [
            "textarea",
            "input[type='text']",
            "[contenteditable='true']",
            "[placeholder*='prompt']",
            "[placeholder*='Prompt']",
            "[placeholder*='describe']"
        ]

        for selector in selectors:
            try:
                elements = self.browser.driver.find_elements(By.CSS_SELECTOR, selector)
                for elem in elements:
                    if elem.is_displayed() and elem.is_enabled():
                        return elem
            except Exception:
                continue

        return None

    def _find_generate_button(self):
        """Find the generate button"""
        driver = self.browser.driver

        # Try finding by text content
        try:
            buttons = driver.find_elements(By.TAG_NAME, "button")
            for btn in buttons:
                if btn.is_displayed() and btn.is_enabled():
                    text = btn.text.lower()
                    if 'generate' in text or 'create' in text or 'go' in text:
                        return btn
        except Exception:
            pass

        return None

    def _wait_for_images(self) -> list:
        """Wait for images to be generated"""
        self.log("Waiting for image generation...")
        driver = self.browser.driver
        start_time = time.time()

        while time.time() - start_time < self.timeout:
            try:
                images = driver.find_elements(
                    By.CSS_SELECTOR,
                    "img[src*='blob:'], img[src*='data:'], img[src*='generated']"
                )
                valid_images = []
                for img in images:
                    src = img.get_attribute('src')
                    if src and ('blob:' in src or 'data:' in src):
                        valid_images.append(img)

                if valid_images:
                    self.log(f"Found {len(valid_images)} image(s)")
                    return valid_images

            except Exception:
                pass

            time.sleep(2)
            elapsed = int(time.time() - start_time)
            if elapsed % 10 == 0:
                self.log(f"Still generating... ({elapsed}s)")

        self.log("Timeout waiting for images")
        return []

    def _download_image(self, img_element, prompt: str) -> Optional[Path]:
        """Download image from page"""
        try:
            src = img_element.get_attribute('src')
            if not src:
                return None

            # Generate filename
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            safe_prompt = "".join(c if c.isalnum() or c in (' ', '-', '_') else '_' for c in prompt[:30])
            filename = f"{timestamp}_{safe_prompt}.png"
            filepath = self.output_dir / filename

            if src.startswith('data:'):
                # Base64 encoded
                header, data = src.split(',', 1)
                image_data = base64.b64decode(data)
                with open(filepath, 'wb') as f:
                    f.write(image_data)
                return filepath

            elif src.startswith('blob:'):
                # Take screenshot of element
                img_element.screenshot(str(filepath))
                return filepath

            else:
                # Download URL
                response = requests.get(src, timeout=30)
                if response.status_code == 200:
                    with open(filepath, 'wb') as f:
                        f.write(response.content)
                    return filepath

        except Exception as e:
            self.log(f"Download error: {str(e)}")

        return None
