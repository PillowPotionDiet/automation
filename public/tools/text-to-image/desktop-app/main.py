#!/usr/bin/env python3
"""
Text-to-Image Desktop Application
Main Entry Point

Google Flow Automation for Image Generation
"""

import sys
import os

# Add app directory to path
app_dir = os.path.dirname(os.path.abspath(__file__))
if app_dir not in sys.path:
    sys.path.insert(0, app_dir)


def check_dependencies():
    """Check if required packages are installed"""
    missing = []

    try:
        import customtkinter
    except ImportError:
        missing.append("customtkinter")

    try:
        from PIL import Image
    except ImportError:
        missing.append("pillow")

    try:
        import requests
    except ImportError:
        missing.append("requests")

    try:
        from cryptography.fernet import Fernet
    except ImportError:
        missing.append("cryptography")

    if missing:
        print("Missing required packages:")
        for pkg in missing:
            print(f"  - {pkg}")
        print("\nPlease run: pip install -r requirements.txt")
        sys.exit(1)


def main():
    """Main entry point"""
    # Check dependencies
    check_dependencies()

    # Import and run app
    from app.app import TextToImageApp

    app = TextToImageApp()
    app.run()


if __name__ == "__main__":
    main()
