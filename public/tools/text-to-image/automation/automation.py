#!/usr/bin/env python3
"""
Text-to-Image Automation Script
Uses Google Flow (ImageFX) via browser automation with Selenium

This script:
1. Logs into Google account (auto or manual)
2. Navigates to Google Flow ImageFX
3. Generates images from prompts
4. Downloads results to output folder

Login Options:
- Auto: Uses email/password from config.json
- Manual: Opens browser popup for user to login manually
"""

import os
import sys
import json
import time
import base64
import requests
from datetime import datetime
from pathlib import Path

try:
    import undetected_chromedriver as uc
    from selenium.webdriver.common.by import By
    from selenium.webdriver.common.keys import Keys
    from selenium.webdriver.support.ui import WebDriverWait
    from selenium.webdriver.support import expected_conditions as EC
    from selenium.common.exceptions import TimeoutException, NoSuchElementException
except ImportError:
    print("ERROR: Required packages not installed.")
    print("Please run: pip install -r requirements.txt")
    sys.exit(1)

# Paths
SCRIPT_DIR = Path(__file__).parent
CONFIG_FILE = SCRIPT_DIR / "config.json"
OUTPUT_DIR = SCRIPT_DIR / "output"
IMAGES_DIR = OUTPUT_DIR / "images"
MANIFEST_FILE = OUTPUT_DIR / "manifest.json"

# URLs
GOOGLE_LOGIN_URL = "https://accounts.google.com/signin"
IMAGEFX_URL = "https://labs.google/fx/tools/image-fx"

# API endpoint for credit deduction (update with your actual URL)
API_BASE_URL = "http://localhost/api"  # Update this to your server URL


def load_config():
    """Load configuration from config.json"""
    if not CONFIG_FILE.exists():
        print(f"ERROR: {CONFIG_FILE} not found!")
        print("Please copy config.template.json to config.json and fill in your details.")
        sys.exit(1)

    with open(CONFIG_FILE, 'r', encoding='utf-8') as f:
        return json.load(f)


def setup_directories():
    """Create output directories if they don't exist"""
    IMAGES_DIR.mkdir(parents=True, exist_ok=True)
    print(f"Output directory: {IMAGES_DIR}")


def create_driver(headless=False):
    """Create undetected Chrome driver"""
    options = uc.ChromeOptions()

    if headless:
        options.add_argument('--headless=new')

    options.add_argument('--disable-blink-features=AutomationControlled')
    options.add_argument('--disable-infobars')
    options.add_argument('--disable-dev-shm-usage')
    options.add_argument('--no-sandbox')
    options.add_argument('--window-size=1920,1080')

    # Set download preferences
    prefs = {
        "download.default_directory": str(IMAGES_DIR),
        "download.prompt_for_download": False,
        "download.directory_upgrade": True,
        "safebrowsing.enabled": True
    }
    options.add_experimental_option("prefs", prefs)

    driver = uc.Chrome(options=options)
    driver.implicitly_wait(10)

    return driver


def login_google_auto(driver, email, password, timeout=60):
    """Automatically login to Google account using credentials"""
    print("\n[LOGIN] Automatic login with credentials...")

    driver.get(GOOGLE_LOGIN_URL)
    time.sleep(2)

    try:
        # Enter email
        print("  - Entering email...")
        email_input = WebDriverWait(driver, timeout).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, "input[type='email']"))
        )
        email_input.clear()
        email_input.send_keys(email)
        email_input.send_keys(Keys.RETURN)
        time.sleep(3)

        # Enter password
        print("  - Entering password...")
        password_input = WebDriverWait(driver, timeout).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, "input[type='password']"))
        )
        password_input.clear()
        password_input.send_keys(password)
        password_input.send_keys(Keys.RETURN)
        time.sleep(3)

        # Check for 2FA or additional verification
        print("  - Checking for 2FA...")
        time.sleep(5)

        # Check if we're still on login page (might need 2FA)
        current_url = driver.current_url
        if "challenge" in current_url or "signin" in current_url:
            print("\n" + "="*50)
            print("  2FA or additional verification required!")
            print("  Please complete the verification in the browser.")
            print("  Waiting up to 120 seconds...")
            print("="*50 + "\n")

            # Wait for user to complete 2FA
            for i in range(120):
                time.sleep(1)
                if "myaccount" in driver.current_url or "google.com" in driver.current_url:
                    if "signin" not in driver.current_url and "challenge" not in driver.current_url:
                        break
                if i % 10 == 0:
                    print(f"  Waiting... {120-i}s remaining")

        print("  - Login successful!")
        return True

    except TimeoutException:
        print("  ERROR: Login timeout. Check your credentials.")
        return False
    except Exception as e:
        print(f"  ERROR: Login failed - {str(e)}")
        return False


def login_google_manual(driver, timeout=300):
    """Open browser for user to manually login to Google"""
    print("\n[LOGIN] Manual login mode...")
    print("="*50)
    print("  A browser window will open.")
    print("  Please login to your Google account manually.")
    print(f"  You have {timeout} seconds to complete login.")
    print("="*50)

    driver.get(GOOGLE_LOGIN_URL)

    print("\n  Waiting for you to complete login...")

    start_time = time.time()
    while time.time() - start_time < timeout:
        current_url = driver.current_url

        # Check if logged in (redirected away from signin)
        if "myaccount.google.com" in current_url:
            print("  - Login successful!")
            return True

        # Check if on Google homepage or any google service (logged in)
        if "google.com" in current_url and "signin" not in current_url and "accounts" not in current_url:
            # Additional check - try to access a protected page
            driver.get(IMAGEFX_URL)
            time.sleep(3)
            if "signin" not in driver.current_url:
                print("  - Login successful!")
                return True
            driver.get(GOOGLE_LOGIN_URL)

        elapsed = int(time.time() - start_time)
        if elapsed % 30 == 0 and elapsed > 0:
            print(f"  Waiting... {timeout - elapsed}s remaining")

        time.sleep(2)

    print("  ERROR: Login timeout")
    return False


def navigate_to_imagefx(driver, timeout=30):
    """Navigate to Google ImageFX"""
    print("\n[NAVIGATE] Going to Google ImageFX...")

    driver.get(IMAGEFX_URL)
    time.sleep(5)

    # Wait for page to load
    try:
        # Wait for the prompt input to appear
        WebDriverWait(driver, timeout).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, "textarea, input[type='text'], [contenteditable='true']"))
        )
        print("  - ImageFX loaded successfully!")
        return True
    except TimeoutException:
        print("  - Page loaded, looking for input field...")
        return True  # Continue anyway, we'll try to find elements


def find_prompt_input(driver):
    """Find the prompt input field"""
    selectors = [
        "textarea",
        "input[type='text']",
        "[contenteditable='true']",
        "[data-testid='prompt-input']",
        ".prompt-input",
        "[placeholder*='prompt']",
        "[placeholder*='Prompt']",
        "[placeholder*='describe']",
        "[placeholder*='Describe']"
    ]

    for selector in selectors:
        try:
            elements = driver.find_elements(By.CSS_SELECTOR, selector)
            for elem in elements:
                if elem.is_displayed() and elem.is_enabled():
                    return elem
        except:
            continue

    return None


def find_generate_button(driver):
    """Find the generate button"""
    selectors = [
        "button[type='submit']",
        "button:contains('Generate')",
        "[data-testid='generate-button']",
        ".generate-button",
        "button.primary"
    ]

    # Try CSS selectors
    for selector in selectors:
        try:
            elements = driver.find_elements(By.CSS_SELECTOR, selector)
            for elem in elements:
                if elem.is_displayed() and elem.is_enabled():
                    text = elem.text.lower()
                    if 'generate' in text or 'create' in text or 'go' in text:
                        return elem
        except:
            continue

    # Try finding by text content
    try:
        buttons = driver.find_elements(By.TAG_NAME, "button")
        for btn in buttons:
            if btn.is_displayed() and btn.is_enabled():
                text = btn.text.lower()
                if 'generate' in text or 'create' in text:
                    return btn
    except:
        pass

    return None


def wait_for_images(driver, timeout=120):
    """Wait for images to be generated"""
    print("  - Waiting for image generation...")

    start_time = time.time()

    while time.time() - start_time < timeout:
        # Look for generated images
        try:
            images = driver.find_elements(By.CSS_SELECTOR, "img[src*='blob:'], img[src*='data:'], img[src*='generated'], .generated-image img")
            if len(images) > 0:
                # Check if images are loaded
                for img in images:
                    src = img.get_attribute('src')
                    if src and ('blob:' in src or 'data:' in src or 'generated' in src):
                        print(f"  - Found {len(images)} generated image(s)")
                        return images
        except:
            pass

        # Check for loading indicators
        time.sleep(2)
        elapsed = int(time.time() - start_time)
        if elapsed % 10 == 0:
            print(f"  - Still generating... ({elapsed}s)")

    print("  - Timeout waiting for images")
    return []


def download_image(driver, img_element, prompt, index, output_dir):
    """Download an image from the page"""
    try:
        src = img_element.get_attribute('src')

        if not src:
            return None

        # Generate filename
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        safe_prompt = "".join(c if c.isalnum() or c in (' ', '-', '_') else '_' for c in prompt[:50])
        filename = f"{timestamp}_{safe_prompt}_{index}.png"
        filepath = output_dir / filename

        if src.startswith('data:'):
            # Base64 encoded image
            header, data = src.split(',', 1)
            image_data = base64.b64decode(data)
            with open(filepath, 'wb') as f:
                f.write(image_data)
            print(f"  - Saved: {filename}")
            return str(filepath)

        elif src.startswith('blob:'):
            # Blob URL - need to use canvas to extract
            # Try right-click save or screenshot
            try:
                # Take screenshot of the image element
                img_element.screenshot(str(filepath))
                print(f"  - Saved (screenshot): {filename}")
                return str(filepath)
            except:
                print(f"  - Could not save blob image")
                return None

        else:
            # Regular URL - download directly
            response = requests.get(src, timeout=30)
            if response.status_code == 200:
                with open(filepath, 'wb') as f:
                    f.write(response.content)
                print(f"  - Saved: {filename}")
                return str(filepath)

    except Exception as e:
        print(f"  - Error downloading image: {str(e)}")

    return None


def deduct_credits(api_token, credits=2):
    """Deduct credits from user account via API"""
    if not api_token:
        print("  - No API token, skipping credit deduction")
        return False

    try:
        response = requests.post(
            f"{API_BASE_URL}/credits/deduct.php",
            headers={
                "Authorization": f"Bearer {api_token}",
                "Content-Type": "application/json"
            },
            json={
                "amount": credits,
                "reason": "Text-to-Image generation",
                "tool": "text-to-image"
            },
            timeout=10
        )

        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                print(f"  - Credits deducted: {credits} (New balance: {data.get('new_balance', '?')})")
                return True
            else:
                print(f"  - Credit deduction failed: {data.get('message', 'Unknown error')}")
        else:
            print(f"  - Credit API error: {response.status_code}")

    except Exception as e:
        print(f"  - Credit deduction error: {str(e)}")

    return False


def generate_image(driver, prompt, output_dir, api_token=None, timeout=120):
    """Generate image from a prompt"""
    print(f"\n  Prompt: {prompt[:60]}...")

    # Find and fill prompt input
    prompt_input = find_prompt_input(driver)
    if not prompt_input:
        print("  ERROR: Could not find prompt input field")
        return []

    # Clear and enter prompt
    try:
        prompt_input.clear()
        time.sleep(0.5)
        prompt_input.send_keys(prompt)
        time.sleep(1)
    except Exception as e:
        print(f"  ERROR: Could not enter prompt - {str(e)}")
        return []

    # Find and click generate button
    generate_btn = find_generate_button(driver)
    if generate_btn:
        try:
            generate_btn.click()
            time.sleep(2)
        except:
            # Try pressing Enter instead
            prompt_input.send_keys(Keys.RETURN)
            time.sleep(2)
    else:
        # Try pressing Enter
        prompt_input.send_keys(Keys.RETURN)
        time.sleep(2)

    # Wait for images
    images = wait_for_images(driver, timeout)

    # Download images
    downloaded = []
    for i, img in enumerate(images):
        filepath = download_image(driver, img, prompt, i, output_dir)
        if filepath:
            downloaded.append({
                'prompt': prompt,
                'file': filepath,
                'timestamp': datetime.now().isoformat()
            })

            # Deduct credits for each image generated
            deduct_credits(api_token, credits=2)

    return downloaded


def save_manifest(results):
    """Save manifest of generated images"""
    manifest = {
        'generated_at': datetime.now().isoformat(),
        'total_images': len(results),
        'images': results
    }

    with open(MANIFEST_FILE, 'w', encoding='utf-8') as f:
        json.dump(manifest, f, indent=2)

    print(f"\nManifest saved to: {MANIFEST_FILE}")


def choose_login_method():
    """Let user choose login method"""
    print("\n" + "="*50)
    print("  Choose Login Method:")
    print("="*50)
    print("  1. Auto Login (use email/password from config)")
    print("  2. Manual Login (login in browser popup)")
    print("="*50)

    while True:
        choice = input("\nEnter choice (1 or 2): ").strip()
        if choice in ['1', '2']:
            return choice
        print("Invalid choice. Please enter 1 or 2.")


def main():
    """Main automation function"""
    print("="*50)
    print("  Text-to-Image Automation")
    print("  Target: Google Flow (ImageFX)")
    print("="*50)

    # Load config
    config = load_config()
    email = config.get('google_email', '')
    password = config.get('google_password', '')
    prompts = config.get('prompts', [])
    settings = config.get('settings', {})
    api_token = config.get('api_token', '')  # For credit deduction

    if not prompts:
        print("ERROR: No prompts configured in config.json")
        sys.exit(1)

    print(f"\nPrompts to process: {len(prompts)}")
    print(f"Credits per image: 2")
    print(f"Total credits needed: {len(prompts) * 2}")

    # Setup directories
    setup_directories()

    # Choose login method
    login_method = settings.get('login_method', 'choose')  # 'auto', 'manual', or 'choose'

    if login_method == 'choose':
        login_choice = choose_login_method()
    elif login_method == 'auto':
        login_choice = '1'
    else:
        login_choice = '2'

    # Create driver
    headless = settings.get('headless', False)
    timeout = settings.get('timeout', 120)
    delay = settings.get('delay_between_prompts', 5)

    # Manual login cannot be headless
    if login_choice == '2' and headless:
        print("\nNote: Switching to visible browser for manual login")
        headless = False

    print(f"\nStarting browser (headless={headless})...")
    driver = create_driver(headless=headless)

    all_results = []

    try:
        # Login to Google
        print("\n[1/4] Logging into Google...")

        if login_choice == '1':
            # Auto login with credentials
            if not email or not password:
                print("ERROR: Google credentials not configured in config.json")
                print("Use manual login instead or add credentials to config.json")
                sys.exit(1)
            login_success = login_google_auto(driver, email, password, timeout)
        else:
            # Manual login
            login_success = login_google_manual(driver, timeout=300)

        if not login_success:
            print("\nERROR: Failed to login to Google")
            return

        # Navigate to ImageFX
        print("\n[2/4] Navigating to ImageFX...")
        if not navigate_to_imagefx(driver, timeout):
            print("\nERROR: Failed to load ImageFX")
            return

        # Process each prompt
        print(f"\n[3/4] Generating images for {len(prompts)} prompts...")

        for i, prompt in enumerate(prompts, 1):
            print(f"\n--- Prompt {i}/{len(prompts)} ---")

            results = generate_image(driver, prompt, IMAGES_DIR, api_token, timeout)
            all_results.extend(results)

            if i < len(prompts):
                print(f"  Waiting {delay}s before next prompt...")
                time.sleep(delay)

        # Save manifest
        print("\n[4/4] Saving results...")
        save_manifest(all_results)

        # Summary
        print("\n" + "="*50)
        print("  COMPLETE!")
        print("="*50)
        print(f"  Total prompts processed: {len(prompts)}")
        print(f"  Total images generated: {len(all_results)}")
        print(f"  Total credits used: {len(all_results) * 2}")
        print(f"  Output folder: {IMAGES_DIR}")
        print("="*50)

    except KeyboardInterrupt:
        print("\n\nInterrupted by user")
    except Exception as e:
        print(f"\nERROR: {str(e)}")
        import traceback
        traceback.print_exc()
    finally:
        print("\nClosing browser...")
        driver.quit()


if __name__ == "__main__":
    main()
