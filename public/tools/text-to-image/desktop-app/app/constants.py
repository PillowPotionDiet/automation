"""
Application Constants
"""

# App Info
APP_NAME = "Text-to-Image Generator"
APP_VERSION = "1.0.0"
APP_AUTHOR = "AI Video Gen"

# API Configuration
API_BASE_URL = "https://automation.pillowpotion.com"
API_LOGIN = f"{API_BASE_URL}/api/auth/login.php"
API_ME = f"{API_BASE_URL}/api/auth/me.php"
API_CREDITS = f"{API_BASE_URL}/api/user/credits.php"
API_DEDUCT = f"{API_BASE_URL}/api/credits/deduct.php"

# Google Flow URL
GOOGLE_LOGIN_URL = "https://accounts.google.com/signin"
IMAGEFX_URL = "https://labs.google/fx/tools/image-fx"

# Window Settings
WINDOW_WIDTH = 1000
WINDOW_HEIGHT = 700
WINDOW_MIN_WIDTH = 900
WINDOW_MIN_HEIGHT = 600

# Credits
CREDITS_PER_IMAGE = 2

# Timeouts
DEFAULT_TIMEOUT = 120
DEFAULT_DELAY = 5
TFA_TIMEOUT = 180

# Paths (relative to user's app data)
APP_DATA_FOLDER = "TextToImage"
CONFIG_FILE = "config.json"
CREDENTIALS_FILE = "credentials.enc"
OUTPUT_FOLDER = "output"
IMAGES_FOLDER = "images"
LOGS_FOLDER = "logs"
