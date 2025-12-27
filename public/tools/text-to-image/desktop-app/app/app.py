"""
Main Application Class
"""

import customtkinter as ctk
from typing import Optional
from app.constants import APP_NAME, WINDOW_WIDTH, WINDOW_HEIGHT, WINDOW_MIN_WIDTH, WINDOW_MIN_HEIGHT
from app.services.api_service import APIService
from app.services.config_service import ConfigService
from app.screens.login_screen import LoginScreen
from app.screens.main_screen import MainScreen


class TextToImageApp:
    """Main application class"""

    def __init__(self):
        # Initialize CustomTkinter
        ctk.set_appearance_mode("dark")
        ctk.set_default_color_theme("blue")

        # Create root window
        self.root = ctk.CTk()
        self.root.title(APP_NAME)
        self.root.geometry(f"{WINDOW_WIDTH}x{WINDOW_HEIGHT}")
        self.root.minsize(WINDOW_MIN_WIDTH, WINDOW_MIN_HEIGHT)

        # Center window on screen
        self._center_window()

        # Initialize services
        self.config = ConfigService()
        self.api = APIService()

        # Current screen
        self.current_screen: Optional[ctk.CTkFrame] = None

        # Apply saved theme
        theme = self.config.get_theme()
        if theme == "system":
            ctk.set_appearance_mode("system")
        else:
            ctk.set_appearance_mode(theme)

        # Protocol for window close
        self.root.protocol("WM_DELETE_WINDOW", self._on_close)

    def _center_window(self):
        """Center window on screen"""
        self.root.update_idletasks()
        screen_width = self.root.winfo_screenwidth()
        screen_height = self.root.winfo_screenheight()
        x = (screen_width - WINDOW_WIDTH) // 2
        y = (screen_height - WINDOW_HEIGHT) // 2
        self.root.geometry(f"{WINDOW_WIDTH}x{WINDOW_HEIGHT}+{x}+{y}")

    def run(self):
        """Run the application"""
        # Check for existing token
        self._check_auth()

        # Start main loop
        self.root.mainloop()

    def _check_auth(self):
        """Check if user is already authenticated"""
        token = self.config.get_secure("api_token")

        if token:
            # Validate token
            if self.api.validate_token(token):
                self._show_main()
                return

        # Show login
        self._show_login()

    def _show_login(self):
        """Show login screen"""
        self._set_screen(LoginScreen(
            self.root,
            self.api,
            on_login_success=self._on_login_success
        ))

    def _show_main(self):
        """Show main screen"""
        self._set_screen(MainScreen(
            self.root,
            self.api,
            self.config,
            on_logout=self._on_logout
        ))

    def _set_screen(self, screen: ctk.CTkFrame):
        """Set current screen"""
        if self.current_screen:
            self.current_screen.destroy()
        self.current_screen = screen

    def _on_login_success(self, user_data: dict, token: Optional[str] = None):
        """Handle successful login"""
        if token:
            self.config.set_secure("api_token", token)

        self._show_main()

    def _on_logout(self):
        """Handle logout"""
        self.config.remove("api_token")
        self.api.logout()
        self._show_login()

    def _on_close(self):
        """Handle window close"""
        # Clean up current screen
        if self.current_screen and hasattr(self.current_screen, 'cleanup'):
            self.current_screen.cleanup()

        self.root.destroy()
