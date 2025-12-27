"""
API Service - Handles communication with web backend
"""

import requests
from typing import Optional, Dict, Any
from app.constants import API_BASE_URL, API_LOGIN, API_ME, API_CREDITS


class APIService:
    """Service for communicating with the web API"""

    def __init__(self, base_url: str = API_BASE_URL):
        self.base_url = base_url
        self.token: Optional[str] = None
        self.user_data: Optional[Dict] = None
        self.session = requests.Session()
        self.session.headers.update({
            "Content-Type": "application/json",
            "Accept": "application/json"
        })

    def _headers(self) -> Dict[str, str]:
        """Get headers with auth token"""
        headers = {"Content-Type": "application/json"}
        if self.token:
            headers["Authorization"] = f"Bearer {self.token}"
        return headers

    def login(self, email: str, password: str) -> Dict[str, Any]:
        """Login with email and password"""
        try:
            response = self.session.post(
                API_LOGIN,
                json={"email": email, "password": password},
                timeout=30
            )
            data = response.json()

            if data.get("success"):
                # Try to get token from response body or cookies
                self.token = data.get("data", {}).get("token")
                self.user_data = data.get("data", {}).get("user")

                # If token not in response, try to extract from cookies
                if not self.token:
                    for cookie in self.session.cookies:
                        if cookie.name == "auth_token":
                            self.token = cookie.value
                            break

                return {
                    "success": True,
                    "user": self.user_data,
                    "token": self.token
                }

            return {
                "success": False,
                "error": data.get("message", "Login failed")
            }

        except requests.exceptions.ConnectionError:
            return {"success": False, "error": "Cannot connect to server"}
        except requests.exceptions.Timeout:
            return {"success": False, "error": "Connection timeout"}
        except Exception as e:
            return {"success": False, "error": str(e)}

    def login_with_token(self, token: str) -> Dict[str, Any]:
        """Validate and use existing token"""
        self.token = token
        result = self.get_user_info()

        if result.get("success"):
            self.user_data = result.get("data")
            return {"success": True, "user": self.user_data}

        self.token = None
        return {"success": False, "error": result.get("message", "Invalid token")}

    def validate_token(self, token: str) -> bool:
        """Check if token is still valid"""
        self.token = token
        result = self.get_user_info()
        if not result.get("success"):
            self.token = None
            return False
        self.user_data = result.get("data")
        return True

    def get_user_info(self) -> Dict[str, Any]:
        """Get current user information"""
        try:
            response = self.session.get(
                API_ME,
                headers=self._headers(),
                timeout=30
            )
            return response.json()
        except requests.exceptions.ConnectionError:
            return {"success": False, "message": "Cannot connect to server"}
        except requests.exceptions.Timeout:
            return {"success": False, "message": "Connection timeout"}
        except Exception as e:
            return {"success": False, "message": str(e)}

    def get_credits(self) -> Dict[str, Any]:
        """Get credit balance and history"""
        try:
            response = self.session.get(
                API_CREDITS,
                headers=self._headers(),
                timeout=30
            )
            return response.json()
        except requests.exceptions.ConnectionError:
            return {"success": False, "message": "Cannot connect to server"}
        except requests.exceptions.Timeout:
            return {"success": False, "message": "Connection timeout"}
        except Exception as e:
            return {"success": False, "message": str(e)}

    def sync_credits(self) -> int:
        """Get current credit balance"""
        result = self.get_credits()
        if result.get("success"):
            balance = result.get("data", {}).get("balance", 0)
            if self.user_data:
                self.user_data["credits"] = balance
            return balance
        return self.user_data.get("credits", 0) if self.user_data else 0

    def deduct_credits(self, amount: int, tool: str = "text-to-image",
                       description: str = "") -> Dict[str, Any]:
        """Deduct credits for generation"""
        try:
            response = self.session.post(
                f"{self.base_url}/api/credits/deduct.php",
                headers=self._headers(),
                json={
                    "amount": amount,
                    "tool": tool,
                    "description": description
                },
                timeout=30
            )
            return response.json()
        except Exception as e:
            return {"success": False, "message": str(e)}

    def get_user_email(self) -> str:
        """Get current user's email"""
        if self.user_data:
            return self.user_data.get("email", "")
        return ""

    def get_user_credits(self) -> int:
        """Get cached credit balance"""
        if self.user_data:
            return self.user_data.get("credits", 0)
        return 0

    def logout(self):
        """Clear session"""
        self.token = None
        self.user_data = None
        self.session = requests.Session()
        self.session.headers.update({
            "Content-Type": "application/json",
            "Accept": "application/json"
        })

    def is_authenticated(self) -> bool:
        """Check if user is authenticated"""
        return self.token is not None and self.user_data is not None
