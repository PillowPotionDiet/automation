"""
Browser Driver Management
"""

import os
from pathlib import Path
from typing import Optional

try:
    import undetected_chromedriver as uc
    from selenium.webdriver.common.by import By
    from selenium.webdriver.common.keys import Keys
    from selenium.webdriver.support.ui import WebDriverWait
    from selenium.webdriver.support import expected_conditions as EC
    from selenium.common.exceptions import TimeoutException, NoSuchElementException
except ImportError as e:
    print(f"Error: Required packages not installed - {e}")
    print("Please run: pip install -r requirements.txt")


class BrowserDriver:
    """Manages Chrome browser driver for automation"""

    def __init__(self, headless: bool = False, download_dir: Optional[Path] = None):
        self.headless = headless
        self.download_dir = download_dir
        self.driver: Optional[uc.Chrome] = None

    def create(self) -> uc.Chrome:
        """Create and configure Chrome driver"""
        options = uc.ChromeOptions()

        if self.headless:
            options.add_argument('--headless=new')

        # Standard options
        options.add_argument('--disable-blink-features=AutomationControlled')
        options.add_argument('--disable-infobars')
        options.add_argument('--disable-dev-shm-usage')
        options.add_argument('--no-sandbox')
        options.add_argument('--window-size=1920,1080')
        options.add_argument('--disable-gpu')

        # Download preferences
        if self.download_dir:
            prefs = {
                "download.default_directory": str(self.download_dir),
                "download.prompt_for_download": False,
                "download.directory_upgrade": True,
                "safebrowsing.enabled": True
            }
            options.add_experimental_option("prefs", prefs)

        # Create driver
        self.driver = uc.Chrome(options=options)
        self.driver.implicitly_wait(10)

        return self.driver

    def get(self) -> Optional[uc.Chrome]:
        """Get existing driver or create new one"""
        if self.driver is None:
            return self.create()
        return self.driver

    def quit(self):
        """Close the browser"""
        if self.driver:
            try:
                self.driver.quit()
            except Exception:
                pass
            self.driver = None

    def is_alive(self) -> bool:
        """Check if driver is still alive"""
        if self.driver is None:
            return False

        try:
            _ = self.driver.title
            return True
        except Exception:
            return False

    def navigate(self, url: str, wait_element: str = None, timeout: int = 30):
        """Navigate to URL and optionally wait for element"""
        if self.driver is None:
            self.create()

        self.driver.get(url)

        if wait_element:
            try:
                WebDriverWait(self.driver, timeout).until(
                    EC.presence_of_element_located((By.CSS_SELECTOR, wait_element))
                )
                return True
            except TimeoutException:
                return False

        return True

    def find_element(self, selector: str, timeout: int = 10):
        """Find element by CSS selector"""
        if self.driver is None:
            return None

        try:
            element = WebDriverWait(self.driver, timeout).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, selector))
            )
            return element
        except TimeoutException:
            return None

    def find_elements(self, selector: str):
        """Find all elements matching selector"""
        if self.driver is None:
            return []

        try:
            return self.driver.find_elements(By.CSS_SELECTOR, selector)
        except Exception:
            return []

    def type_text(self, selector: str, text: str, clear: bool = True, timeout: int = 10):
        """Type text into input field"""
        element = self.find_element(selector, timeout)
        if element:
            if clear:
                element.clear()
            element.send_keys(text)
            return True
        return False

    def click(self, selector: str, timeout: int = 10):
        """Click element"""
        element = self.find_element(selector, timeout)
        if element:
            element.click()
            return True
        return False

    def screenshot(self, filepath: Path):
        """Take screenshot"""
        if self.driver:
            self.driver.save_screenshot(str(filepath))

    def get_current_url(self) -> str:
        """Get current URL"""
        if self.driver:
            return self.driver.current_url
        return ""

    def get_page_source(self) -> str:
        """Get page HTML source"""
        if self.driver:
            return self.driver.page_source
        return ""
