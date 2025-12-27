"""
Config Service - Handles application configuration and storage
"""

import os
import json
from pathlib import Path
from typing import Any, Optional, List
from app.constants import (
    APP_DATA_FOLDER, CONFIG_FILE, OUTPUT_FOLDER,
    IMAGES_FOLDER, LOGS_FOLDER, DEFAULT_TIMEOUT, DEFAULT_DELAY
)
from app.services.crypto_service import CryptoService


class ConfigService:
    """Service for managing application configuration"""

    # Keys that should be encrypted
    SECURE_KEYS = ["api_token", "google_password"]

    def __init__(self):
        self.crypto = CryptoService()
        self._config: dict = {}
        self._ensure_directories()
        self._load_config()

    def _get_app_data_dir(self) -> Path:
        """Get application data directory"""
        if os.name == "nt":  # Windows
            base = Path(os.environ.get("APPDATA", Path.home()))
        else:  # macOS/Linux
            base = Path.home() / ".config"

        app_dir = base / APP_DATA_FOLDER
        return app_dir

    def _ensure_directories(self):
        """Create necessary directories"""
        app_dir = self._get_app_data_dir()
        app_dir.mkdir(parents=True, exist_ok=True)

        # Create subdirectories
        (app_dir / OUTPUT_FOLDER / IMAGES_FOLDER).mkdir(parents=True, exist_ok=True)
        (app_dir / LOGS_FOLDER).mkdir(parents=True, exist_ok=True)

    def _get_config_path(self) -> Path:
        """Get config file path"""
        return self._get_app_data_dir() / CONFIG_FILE

    def _load_config(self):
        """Load configuration from file"""
        config_path = self._get_config_path()

        if config_path.exists():
            try:
                with open(config_path, "r", encoding="utf-8") as f:
                    self._config = json.load(f)

                # Decrypt secure values
                for key in self.SECURE_KEYS:
                    if key in self._config and self._config[key]:
                        decrypted = self.crypto.decrypt(self._config[key])
                        if decrypted:
                            self._config[key] = decrypted
                        else:
                            # Decryption failed, clear the value
                            self._config[key] = ""
            except Exception as e:
                print(f"Error loading config: {e}")
                self._config = {}
        else:
            # Default configuration
            self._config = self._get_defaults()
            self._save_config()

    def _save_config(self):
        """Save configuration to file"""
        config_path = self._get_config_path()

        try:
            # Create a copy with encrypted values
            save_config = self._config.copy()
            for key in self.SECURE_KEYS:
                if key in save_config and save_config[key]:
                    save_config[key] = self.crypto.encrypt(save_config[key])

            with open(config_path, "w", encoding="utf-8") as f:
                json.dump(save_config, f, indent=2)
        except Exception as e:
            print(f"Error saving config: {e}")

    def _get_defaults(self) -> dict:
        """Get default configuration"""
        return {
            "api_token": "",
            "google_email": "",
            "google_password": "",
            "prompts": [],
            "settings": {
                "timeout": DEFAULT_TIMEOUT,
                "delay": DEFAULT_DELAY,
                "headless": False,
                "theme": "dark",
                "auto_sync_credits": True,
            },
            "recent_generations": [],
        }

    # Public methods

    def get(self, key: str, default: Any = None) -> Any:
        """Get a configuration value"""
        keys = key.split(".")
        value = self._config

        for k in keys:
            if isinstance(value, dict) and k in value:
                value = value[k]
            else:
                return default

        return value

    def set(self, key: str, value: Any):
        """Set a configuration value"""
        keys = key.split(".")
        config = self._config

        for k in keys[:-1]:
            if k not in config:
                config[k] = {}
            config = config[k]

        config[keys[-1]] = value
        self._save_config()

    def get_secure(self, key: str) -> str:
        """Get a secure (encrypted) value"""
        return self.get(key, "")

    def set_secure(self, key: str, value: str):
        """Set a secure (encrypted) value"""
        self.set(key, value)

    def remove(self, key: str):
        """Remove a configuration key"""
        keys = key.split(".")
        config = self._config

        for k in keys[:-1]:
            if k not in config:
                return
            config = config[k]

        if keys[-1] in config:
            del config[keys[-1]]
            self._save_config()

    def get_all(self) -> dict:
        """Get all configuration"""
        return self._config.copy()

    # Path helpers

    def get_app_dir(self) -> Path:
        """Get application data directory"""
        return self._get_app_data_dir()

    def get_output_dir(self) -> Path:
        """Get output directory"""
        return self._get_app_data_dir() / OUTPUT_FOLDER

    def get_images_dir(self) -> Path:
        """Get images directory"""
        return self._get_app_data_dir() / OUTPUT_FOLDER / IMAGES_FOLDER

    def get_logs_dir(self) -> Path:
        """Get logs directory"""
        return self._get_app_data_dir() / LOGS_FOLDER

    # Prompts management

    def get_prompts(self) -> List[str]:
        """Get list of prompts"""
        return self.get("prompts", [])

    def set_prompts(self, prompts: List[str]):
        """Set list of prompts"""
        self.set("prompts", prompts)

    def add_prompt(self, prompt: str):
        """Add a prompt"""
        prompts = self.get_prompts()
        if prompt and prompt not in prompts:
            prompts.append(prompt)
            self.set_prompts(prompts)

    def remove_prompt(self, index: int):
        """Remove a prompt by index"""
        prompts = self.get_prompts()
        if 0 <= index < len(prompts):
            prompts.pop(index)
            self.set_prompts(prompts)

    def clear_prompts(self):
        """Clear all prompts"""
        self.set_prompts([])

    # Settings helpers

    def get_timeout(self) -> int:
        """Get timeout setting"""
        return self.get("settings.timeout", DEFAULT_TIMEOUT)

    def get_delay(self) -> int:
        """Get delay setting"""
        return self.get("settings.delay", DEFAULT_DELAY)

    def is_headless(self) -> bool:
        """Get headless mode setting"""
        return self.get("settings.headless", False)

    def get_theme(self) -> str:
        """Get theme setting"""
        return self.get("settings.theme", "dark")

    # Recent generations

    def add_generation(self, generation: dict):
        """Add a generation to history"""
        recent = self.get("recent_generations", [])
        recent.insert(0, generation)
        # Keep only last 50
        self.set("recent_generations", recent[:50])

    def get_recent_generations(self, limit: int = 10) -> List[dict]:
        """Get recent generations"""
        return self.get("recent_generations", [])[:limit]

    def clear_history(self):
        """Clear generation history"""
        self.set("recent_generations", [])

    # Reset

    def reset(self):
        """Reset to defaults"""
        self._config = self._get_defaults()
        self._save_config()
