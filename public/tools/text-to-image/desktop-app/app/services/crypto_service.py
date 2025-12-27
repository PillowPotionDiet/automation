"""
Crypto Service - Handles credential encryption
"""

import os
import base64
import hashlib
from pathlib import Path
from typing import Optional
from cryptography.fernet import Fernet, InvalidToken


class CryptoService:
    """Service for encrypting/decrypting sensitive data"""

    def __init__(self):
        self._key: Optional[bytes] = None

    def _get_machine_id(self) -> str:
        """Get a unique machine identifier"""
        # Use environment variables and system info
        components = [
            os.environ.get("COMPUTERNAME", ""),
            os.environ.get("USERNAME", ""),
            os.environ.get("PROCESSOR_IDENTIFIER", ""),
            str(Path.home()),
        ]
        machine_string = "|".join(components)
        return machine_string

    def _derive_key(self) -> bytes:
        """Derive encryption key from machine ID"""
        if self._key:
            return self._key

        machine_id = self._get_machine_id()
        # Use SHA256 to get a 32-byte key, then base64 encode for Fernet
        hash_bytes = hashlib.sha256(machine_id.encode()).digest()
        self._key = base64.urlsafe_b64encode(hash_bytes)
        return self._key

    def encrypt(self, data: str) -> str:
        """Encrypt a string"""
        if not data:
            return ""

        try:
            key = self._derive_key()
            fernet = Fernet(key)
            encrypted = fernet.encrypt(data.encode())
            return base64.urlsafe_b64encode(encrypted).decode()
        except Exception as e:
            print(f"Encryption error: {e}")
            return ""

    def decrypt(self, encrypted_data: str) -> str:
        """Decrypt a string"""
        if not encrypted_data:
            return ""

        try:
            key = self._derive_key()
            fernet = Fernet(key)
            decoded = base64.urlsafe_b64decode(encrypted_data.encode())
            decrypted = fernet.decrypt(decoded)
            return decrypted.decode()
        except InvalidToken:
            print("Invalid token - data may be corrupted or from different machine")
            return ""
        except Exception as e:
            print(f"Decryption error: {e}")
            return ""

    def encrypt_dict(self, data: dict, keys_to_encrypt: list) -> dict:
        """Encrypt specific keys in a dictionary"""
        result = data.copy()
        for key in keys_to_encrypt:
            if key in result and result[key]:
                result[key] = self.encrypt(str(result[key]))
        return result

    def decrypt_dict(self, data: dict, keys_to_decrypt: list) -> dict:
        """Decrypt specific keys in a dictionary"""
        result = data.copy()
        for key in keys_to_decrypt:
            if key in result and result[key]:
                result[key] = self.decrypt(str(result[key]))
        return result
