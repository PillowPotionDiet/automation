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
        progress_callback: Optional[Callable[[int, int, str], None]] = None,
        style_tags: Optional[List[str]] = None,
        aspect_ratio: str = "Square",
        lock_seed: bool = False,
        project_name: str = ""
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
        self.style_tags = style_tags or []
        self.aspect_ratio = aspect_ratio
        self.lock_seed = lock_seed
        self.project_name = project_name

        self.browser: Optional[BrowserDriver] = None
        self.is_first_generation = True
        self.locked_seed = None

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
        time.sleep(3)

        try:
            # Enter email
            self.log("Entering email...")
            email_input = WebDriverWait(driver, self.timeout).until(
                EC.element_to_be_clickable((By.CSS_SELECTOR, "input[type='email']"))
            )
            email_input.clear()
            email_input.send_keys(self.email)
            time.sleep(0.5)
            email_input.send_keys(Keys.RETURN)

            # Wait for password field to appear (page transition)
            self.log("Waiting for password field...")
            time.sleep(4)

            # Re-find password input after page change (avoid stale element)
            self.log("Entering password...")
            password_input = WebDriverWait(driver, self.timeout).until(
                EC.element_to_be_clickable((By.CSS_SELECTOR, "input[type='password']"))
            )
            # Wait a bit more for the field to be fully ready
            time.sleep(1)

            # Re-locate to avoid stale element
            password_input = driver.find_element(By.CSS_SELECTOR, "input[type='password']")
            password_input.click()
            time.sleep(0.3)
            password_input.send_keys(self.password)
            time.sleep(0.5)
            password_input.send_keys(Keys.RETURN)

            # Wait for login to complete
            self.log("Checking login status...")
            time.sleep(5)

            current_url = driver.current_url
            if "challenge" in current_url or "signin/v2" in current_url:
                self.log("2FA required - please complete verification in browser...")
                return self._wait_for_2fa()

            # Check if still on signin page with error
            if "signin" in current_url and "identifier" not in current_url:
                # Might still be processing or have an error
                time.sleep(3)
                current_url = driver.current_url

            if "myaccount" in current_url or "google.com" in current_url and "signin" not in current_url:
                self.log("Login successful!")
                return True

            # Check for challenge/2FA
            if "challenge" in current_url:
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

        # Dismiss any popups
        self._dismiss_popups()

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

    def _dismiss_popups(self):
        """Dismiss common popups like 'Try Whisk', 'Continue with Google', Chrome signin, etc."""
        driver = self.browser.driver

        # Use JavaScript to find and click dismiss buttons - PRIORITIZE close icons first
        dismiss_script = """
        (function() {
            var dismissed = [];

            // FIRST: Look for Whisk/modal popups with close button at bottom
            // These popups have a close X button typically at the bottom
            var dialogs = document.querySelectorAll('[role="dialog"], [aria-modal="true"], .modal, .popup, .overlay');
            dialogs.forEach(function(dialog) {
                if (dialog.offsetParent === null) return;

                // Find close button within dialog - look for X icon buttons
                var closeBtn = dialog.querySelector('button[aria-label*="close" i], button[aria-label*="Close"], [role="button"][aria-label*="close" i]');
                if (!closeBtn) {
                    // Look for small icon buttons (close buttons are usually small with SVG)
                    var btns = dialog.querySelectorAll('button, [role="button"]');
                    btns.forEach(function(btn) {
                        var rect = btn.getBoundingClientRect();
                        var hasSvg = btn.querySelector('svg');
                        var text = (btn.textContent || '').trim();
                        // Close buttons: small, has SVG icon, not much text
                        if (hasSvg && rect.width < 60 && rect.height < 60 && text.length < 3) {
                            closeBtn = btn;
                        }
                    });
                }
                if (closeBtn) {
                    try {
                        closeBtn.click();
                        dismissed.push('dialog-close');
                    } catch(e) {}
                }
            });

            // SECOND: Find any standalone close buttons (X icons) outside dialogs
            var allButtons = document.querySelectorAll('button, [role="button"]');
            allButtons.forEach(function(btn) {
                if (btn.offsetParent === null) return; // not visible

                var rect = btn.getBoundingClientRect();
                var ariaLabel = (btn.getAttribute('aria-label') || '').toLowerCase();
                var text = (btn.textContent || '').trim();
                var className = (btn.className || '').toLowerCase();

                // Close button characteristics
                var isCloseButton = (
                    ariaLabel.includes('close') ||
                    ariaLabel.includes('dismiss') ||
                    className.includes('close') ||
                    (text === 'X' || text === '×' || text === 'x' || text === '') &&
                    (rect.width < 60 && rect.height < 60 && btn.querySelector('svg'))
                );

                // Avoid clicking actual feature buttons
                var isFeatureButton = (
                    text.toLowerCase().includes('try') ||
                    text.toLowerCase().includes('whisk') ||
                    text.toLowerCase().includes('start') ||
                    text.toLowerCase().includes('create') ||
                    text.toLowerCase().includes('generate')
                );

                if (isCloseButton && !isFeatureButton) {
                    try {
                        btn.click();
                        dismissed.push('close-btn: ' + (ariaLabel || text || 'icon'));
                    } catch(e) {}
                }
            });

            // THIRD: Click safe dismiss text buttons
            var buttons = document.querySelectorAll('button, [role="button"], a');
            buttons.forEach(function(btn) {
                if (btn.offsetParent === null) return;

                var text = (btn.textContent || btn.innerText || '').toLowerCase().trim();

                // Only click specific dismiss text, NOT promotional buttons
                var safeDismissTexts = [
                    'use chrome without an account',
                    'use without an account',
                    'no thanks',
                    'no, thanks',
                    'maybe later',
                    'not now',
                    'dismiss',
                    'got it',
                    'continue without'
                ];

                for (var i = 0; i < safeDismissTexts.length; i++) {
                    if (text.includes(safeDismissTexts[i])) {
                        try {
                            btn.click();
                            dismissed.push(safeDismissTexts[i]);
                        } catch(e) {}
                        break;
                    }
                }
            });

            return dismissed;
        })();
        """

        try:
            dismissed = driver.execute_script(dismiss_script)
            if dismissed and len(dismissed) > 0:
                self.log(f"Dismissed popups: {dismissed}")
                time.sleep(0.5)
        except Exception:
            pass

        # Press Escape key multiple times as backup
        try:
            from selenium.webdriver.common.action_chains import ActionChains
            for _ in range(3):
                ActionChains(driver).send_keys(Keys.ESCAPE).perform()
                time.sleep(0.3)
        except Exception:
            pass

    def _handle_feeling_lucky(self):
        """Handle 'I'm feeling lucky' button that appears on first prompt"""
        driver = self.browser.driver

        script = """
        (function() {
            // Look for "I'm feeling lucky" button
            var buttons = document.querySelectorAll('button, [role="button"]');
            for (var i = 0; i < buttons.length; i++) {
                var btn = buttons[i];
                var text = (btn.textContent || btn.innerText || '').toLowerCase();
                if (text.includes('feeling lucky') || text.includes("i'm feeling lucky")) {
                    // This is the random generation button - we want to click the regular generate instead
                    // Find the other generate/create button
                    continue;
                }
            }
            // Click outside the popup or find and click actual generate button
            var generateBtns = document.querySelectorAll('button, [role="button"]');
            for (var i = 0; i < generateBtns.length; i++) {
                var btn = generateBtns[i];
                if (btn.offsetParent === null) continue;
                var text = (btn.textContent || '').toLowerCase();
                var ariaLabel = (btn.getAttribute('aria-label') || '').toLowerCase();
                // Look for plain generate/create button (not "feeling lucky")
                if ((text.includes('generate') || text.includes('create') || ariaLabel.includes('generate'))
                    && !text.includes('lucky')) {
                    btn.click();
                    return 'clicked-generate';
                }
            }
            return 'no-action';
        })();
        """

        try:
            result = driver.execute_script(script)
            if result == 'clicked-generate':
                self.log("Clicked generate button (skipped 'I'm feeling lucky')")
                return True
        except Exception:
            pass
        return False

    def _select_aspect_ratio(self):
        """Select the aspect ratio from dropdown"""
        if not self.aspect_ratio or self.aspect_ratio == "Square":
            return  # Default is square, no need to change

        driver = self.browser.driver

        # Map friendly names to values
        ratio_map = {
            "Square": "Square",
            "Portrait (9:16)": "Portrait (9:16)",
            "Landscape (16:9)": "Landscape (16:9)",
            "Mobile portrait (3:4)": "Mobile portrait (3:4)",
            "Mobile landscape (4:3)": "Mobile landscape (4:3)"
        }

        target_ratio = ratio_map.get(self.aspect_ratio, self.aspect_ratio)
        self.log(f"Selecting aspect ratio: {target_ratio}")

        script = f"""
        (function() {{
            // Find aspect ratio dropdown/selector
            var selectors = document.querySelectorAll('button, [role="button"], [role="listbox"], select');

            // Look for aspect ratio button/dropdown
            for (var i = 0; i < selectors.length; i++) {{
                var el = selectors[i];
                if (el.offsetParent === null) continue;

                var text = (el.textContent || '').toLowerCase();
                var ariaLabel = (el.getAttribute('aria-label') || '').toLowerCase();

                // Find the aspect ratio dropdown
                if (text.includes('square') || text.includes('portrait') || text.includes('landscape') ||
                    ariaLabel.includes('aspect') || ariaLabel.includes('ratio')) {{
                    el.click();
                    break;
                }}
            }}

            // Wait a moment then click the desired option
            setTimeout(function() {{
                var options = document.querySelectorAll('[role="option"], [role="menuitem"], li, button');
                for (var i = 0; i < options.length; i++) {{
                    var opt = options[i];
                    if (opt.offsetParent === null) continue;
                    var text = (opt.textContent || '').trim();
                    if (text.includes('{target_ratio}') || text === '{target_ratio}') {{
                        opt.click();
                        return 'selected';
                    }}
                }}
            }}, 300);

            return 'opened';
        }})();
        """

        try:
            driver.execute_script(script)
            time.sleep(0.5)
        except Exception as e:
            self.log(f"Could not select aspect ratio: {e}")

    def _select_style_tags(self):
        """Select style tags if specified"""
        if not self.style_tags:
            return

        driver = self.browser.driver
        self.log(f"Selecting style tags: {self.style_tags}")

        for tag in self.style_tags:
            script = f"""
            (function() {{
                // Find style tag buttons/chips
                var elements = document.querySelectorAll('button, [role="button"], [role="option"], .chip, .tag');

                for (var i = 0; i < elements.length; i++) {{
                    var el = elements[i];
                    if (el.offsetParent === null) continue;

                    var text = (el.textContent || '').trim().toLowerCase();
                    var targetTag = '{tag}'.toLowerCase();

                    if (text === targetTag || text.includes(targetTag)) {{
                        // Check if not already selected
                        var isSelected = el.classList.contains('selected') ||
                                        el.getAttribute('aria-selected') === 'true' ||
                                        el.getAttribute('data-selected') === 'true';
                        if (!isSelected) {{
                            el.click();
                            return 'clicked: ' + text;
                        }}
                        return 'already-selected: ' + text;
                    }}
                }}
                return 'not-found: {tag}';
            }})();
            """

            try:
                result = driver.execute_script(script)
                self.log(f"Style tag result: {result}")
                time.sleep(0.3)
            except Exception:
                pass

    def _lock_seed(self):
        """Lock the seed for consistency across generations"""
        driver = self.browser.driver

        script = """
        (function() {
            // Look for seed lock button/toggle
            var elements = document.querySelectorAll('button, [role="button"], [role="switch"], input[type="checkbox"]');

            for (var i = 0; i < elements.length; i++) {
                var el = elements[i];
                if (el.offsetParent === null) continue;

                var text = (el.textContent || '').toLowerCase();
                var ariaLabel = (el.getAttribute('aria-label') || '').toLowerCase();
                var nearby = el.parentElement ? (el.parentElement.textContent || '').toLowerCase() : '';

                // Find seed lock control
                if (text.includes('seed') || ariaLabel.includes('seed') ||
                    nearby.includes('seed') || text.includes('lock') || ariaLabel.includes('lock')) {

                    // Check if it's a toggle/switch
                    var isChecked = el.getAttribute('aria-checked') === 'true' ||
                                   el.checked === true ||
                                   el.classList.contains('active') ||
                                   el.classList.contains('selected');

                    if (!isChecked) {
                        el.click();
                        return 'locked';
                    }
                    return 'already-locked';
                }
            }

            // Alternative: look for lock icon near seed
            var lockIcons = document.querySelectorAll('[class*="lock"], svg');
            for (var i = 0; i < lockIcons.length; i++) {
                var icon = lockIcons[i];
                var parent = icon.closest('button, [role="button"]');
                if (parent && parent.offsetParent !== null) {
                    var nearbyText = parent.parentElement ? parent.parentElement.textContent.toLowerCase() : '';
                    if (nearbyText.includes('seed')) {
                        parent.click();
                        return 'locked-via-icon';
                    }
                }
            }

            return 'not-found';
        })();
        """

        try:
            result = driver.execute_script(script)
            self.log(f"Seed lock result: {result}")
            return result != 'not-found'
        except Exception as e:
            self.log(f"Could not lock seed: {e}")
            return False

    def _generate_single(self, prompt: str) -> Optional[Dict[str, Any]]:
        """Generate a single image from prompt"""
        driver = self.browser.driver

        try:
            # Dismiss any popups first
            self._dismiss_popups()
            time.sleep(0.5)

            # On first generation, set up aspect ratio and style tags
            if self.is_first_generation:
                self._select_aspect_ratio()
                self._select_style_tags()
                time.sleep(0.5)

            # Use JavaScript to set prompt - most reliable method
            self.log(f"Entering prompt: {prompt[:50]}...")
            prompt_set = self._set_prompt_js(prompt)

            if not prompt_set:
                # Fallback to Selenium method
                self.log("JS method failed, trying Selenium...")
                prompt_input = self._find_prompt_input()
                if not prompt_input:
                    self.log("Could not find prompt input")
                    return None

                # Click and clear
                prompt_input.click()
                time.sleep(0.3)
                prompt_input.send_keys(Keys.CONTROL + "a")
                prompt_input.send_keys(Keys.DELETE)
                time.sleep(0.2)

                # Type prompt
                prompt_input.send_keys(prompt)
                time.sleep(0.5)

            # Dismiss any popups that may have appeared
            self._dismiss_popups()
            time.sleep(0.5)

            # Click generate button using JavaScript
            self.log("Clicking generate button...")
            clicked = self._click_generate_js()

            if not clicked:
                # Fallback - try Enter key
                self.log("Trying Enter key...")
                prompt_input = self._find_prompt_input()
                if prompt_input:
                    prompt_input.send_keys(Keys.RETURN)

            time.sleep(2)

            # Handle "I'm feeling lucky" popup if it appears (first generation)
            if self.is_first_generation:
                self._dismiss_popups()
                # Try to click regular generate if feeling lucky popup appeared
                self._handle_feeling_lucky()
                time.sleep(1)

            # Dismiss popups again (sometimes they appear after clicking generate)
            self._dismiss_popups()

            # Wait for image
            images = self._wait_for_images()
            if not images:
                return None

            # After first successful generation, lock seed if requested
            if self.is_first_generation and self.lock_seed:
                self.log("Locking seed for consistency...")
                self._lock_seed()
                time.sleep(0.5)

            self.is_first_generation = False

            # Download first image
            filepath = self._download_image(images[0], prompt)
            if filepath:
                return {
                    "prompt": prompt,
                    "file": str(filepath),
                    "timestamp": datetime.now().isoformat(),
                    "project": self.project_name,
                    "aspect_ratio": self.aspect_ratio,
                    "style_tags": self.style_tags
                }

        except Exception as e:
            self.log(f"Generation error: {str(e)}")

        return None

    def _set_prompt_js(self, prompt: str) -> bool:
        """Set prompt using JavaScript - more reliable"""
        driver = self.browser.driver

        # Escape the prompt for JavaScript
        escaped_prompt = prompt.replace("\\", "\\\\").replace("'", "\\'").replace("\n", "\\n").replace("\r", "")

        script = f"""
        (function() {{
            // Find textarea or input for prompt
            var input = document.querySelector('textarea, input[type="text"][placeholder*="prompt" i], input[type="text"][placeholder*="describe" i], [contenteditable="true"]');

            if (!input) {{
                // Try to find by looking for visible text inputs
                var inputs = document.querySelectorAll('textarea, input[type="text"]');
                for (var i = 0; i < inputs.length; i++) {{
                    if (inputs[i].offsetParent !== null) {{
                        input = inputs[i];
                        break;
                    }}
                }}
            }}

            if (!input) return false;

            // Focus the input
            input.focus();
            input.click();

            // Clear existing content
            if (input.tagName === 'TEXTAREA' || input.tagName === 'INPUT') {{
                input.value = '';
                input.value = '{escaped_prompt}';
            }} else {{
                // contenteditable
                input.innerHTML = '';
                input.innerText = '{escaped_prompt}';
            }}

            // Trigger input events so the page detects the change
            input.dispatchEvent(new Event('input', {{ bubbles: true }}));
            input.dispatchEvent(new Event('change', {{ bubbles: true }}));
            input.dispatchEvent(new KeyboardEvent('keyup', {{ bubbles: true }}));

            return true;
        }})();
        """

        try:
            result = driver.execute_script(script)
            return result == True
        except Exception as e:
            self.log(f"JS prompt error: {str(e)}")
            return False

    def _click_generate_js(self) -> bool:
        """Click generate button using JavaScript"""
        driver = self.browser.driver

        script = """
        (function() {
            // Find generate/create button
            var buttons = document.querySelectorAll('button, [role="button"]');
            var generateBtn = null;

            for (var i = 0; i < buttons.length; i++) {
                var btn = buttons[i];
                var text = (btn.textContent || btn.innerText || '').toLowerCase();
                var ariaLabel = (btn.getAttribute('aria-label') || '').toLowerCase();

                // Skip if not visible
                if (btn.offsetParent === null) continue;

                // Look for generate/create button
                if (text.includes('generate') || text.includes('create') ||
                    ariaLabel.includes('generate') || ariaLabel.includes('create')) {
                    generateBtn = btn;
                    break;
                }
            }

            // Also try to find by icon (play/arrow icon often used for generate)
            if (!generateBtn) {
                var iconBtns = document.querySelectorAll('button svg, [role="button"] svg');
                for (var i = 0; i < iconBtns.length; i++) {
                    var parent = iconBtns[i].closest('button, [role="button"]');
                    if (parent && parent.offsetParent !== null) {
                        // Check if it's near the prompt input
                        generateBtn = parent;
                        break;
                    }
                }
            }

            if (generateBtn) {
                generateBtn.click();
                return true;
            }

            return false;
        })();
        """

        try:
            result = driver.execute_script(script)
            return result == True
        except Exception:
            return False

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
