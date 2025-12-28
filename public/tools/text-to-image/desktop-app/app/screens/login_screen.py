"""
Login Screen - API Token or Email/Password authentication
"""

import customtkinter as ctk
from typing import Callable, Optional
import webbrowser
from app.theme import COLORS, FONTS, BUTTON_STYLES, INPUT_STYLE, get_theme_colors
from app.constants import APP_NAME, API_BASE_URL


class LoginScreen(ctk.CTkFrame):
    """Login screen with API token or email/password authentication"""

    def __init__(self, parent, api_service, on_login_success: Callable):
        super().__init__(parent, fg_color=COLORS["dark"]["bg"])
        self.parent = parent
        self.api = api_service
        self.on_login_success = on_login_success
        self.colors = get_theme_colors("dark")

        self._create_widgets()

    def _create_widgets(self):
        """Create login screen widgets"""
        # Center container
        center_frame = ctk.CTkFrame(self, fg_color="transparent")
        center_frame.place(relx=0.5, rely=0.5, anchor="center")

        # Logo frame with icon-style border
        logo_frame = ctk.CTkFrame(
            center_frame,
            fg_color=self.colors["card"],
            corner_radius=16,
            width=80,
            height=80
        )
        logo_frame.pack(pady=(0, 15))
        logo_frame.pack_propagate(False)

        # Logo text icon
        logo_label = ctk.CTkLabel(
            logo_frame,
            text="T2I",
            font=("Segoe UI", 28, "bold"),
            text_color=self.colors["primary"]
        )
        logo_label.place(relx=0.5, rely=0.5, anchor="center")

        # App title
        title_label = ctk.CTkLabel(
            center_frame,
            text=APP_NAME,
            font=FONTS["heading_lg"],
            text_color=self.colors["text"]
        )
        title_label.pack(pady=(0, 5))

        # Subtitle
        subtitle_label = ctk.CTkLabel(
            center_frame,
            text="Google Flow Automation",
            font=FONTS["body"],
            text_color=self.colors["text_secondary"]
        )
        subtitle_label.pack(pady=(0, 30))

        # Login card
        login_card = ctk.CTkFrame(
            center_frame,
            fg_color=self.colors["card"],
            corner_radius=16
        )
        login_card.pack(padx=20, pady=10)

        # Tab view for login methods
        self.tabview = ctk.CTkTabview(
            login_card,
            fg_color="transparent",
            segmented_button_fg_color=self.colors["bg_secondary"],
            segmented_button_selected_color=self.colors["primary"],
            segmented_button_unselected_color=self.colors["bg_secondary"],
            width=380,
            height=320
        )
        self.tabview.pack(padx=20, pady=20)

        # API Token tab
        token_tab = self.tabview.add("API Token")
        self._create_token_tab(token_tab)

        # Email/Password tab
        email_tab = self.tabview.add("Email / Password")
        self._create_email_tab(email_tab)

        # Error message
        self.error_label = ctk.CTkLabel(
            center_frame,
            text="",
            font=FONTS["body_sm"],
            text_color=self.colors["error"]
        )
        self.error_label.pack(pady=(10, 0))

        # Server info
        server_frame = ctk.CTkFrame(center_frame, fg_color="transparent")
        server_frame.pack(pady=(20, 0))

        server_label = ctk.CTkLabel(
            server_frame,
            text=f"Server: {API_BASE_URL.replace('https://', '')}",
            font=FONTS["caption"],
            text_color=self.colors["text_secondary"]
        )
        server_label.pack(side="left")

        # Pack to fill parent
        self.pack(fill="both", expand=True)

    def _create_token_tab(self, parent):
        """Create API token login tab"""
        # Instructions
        info_label = ctk.CTkLabel(
            parent,
            text="Enter your API token from the web app:",
            font=FONTS["body_sm"],
            text_color=self.colors["text_secondary"],
            anchor="w"
        )
        info_label.pack(fill="x", pady=(10, 5))

        # Token input
        self.token_entry = ctk.CTkEntry(
            parent,
            placeholder_text="Paste your API token here...",
            font=FONTS["body"],
            height=INPUT_STYLE["height"],
            corner_radius=INPUT_STYLE["corner_radius"],
            border_width=INPUT_STYLE["border_width"],
            border_color=self.colors["border"],
            fg_color=self.colors["input_bg"]
        )
        self.token_entry.pack(fill="x", pady=(0, 10))

        # Help link
        help_btn = ctk.CTkButton(
            parent,
            text="❓ How to get API token",
            font=FONTS["body_sm"],
            fg_color="transparent",
            hover_color=self.colors["card_hover"],
            text_color=self.colors["primary"],
            anchor="w",
            command=self._show_token_help
        )
        help_btn.pack(fill="x", pady=(0, 10))

        # Remember me
        self.remember_var = ctk.BooleanVar(value=True)
        remember_check = ctk.CTkCheckBox(
            parent,
            text="Remember me",
            font=FONTS["body_sm"],
            variable=self.remember_var,
            fg_color=self.colors["primary"],
            hover_color=self.colors["primary_hover"]
        )
        remember_check.pack(fill="x", pady=(0, 15))

        # Login button
        login_btn = ctk.CTkButton(
            parent,
            text="Login with Token",
            font=FONTS["body"],
            command=self._login_with_token,
            **BUTTON_STYLES["primary"]
        )
        login_btn.pack(fill="x", pady=(0, 10))

    def _create_email_tab(self, parent):
        """Create email/password login tab"""
        # Email input
        email_label = ctk.CTkLabel(
            parent,
            text="Email",
            font=FONTS["body_sm"],
            text_color=self.colors["text_secondary"],
            anchor="w"
        )
        email_label.pack(fill="x", pady=(10, 2))

        self.email_entry = ctk.CTkEntry(
            parent,
            placeholder_text="your-email@example.com",
            font=FONTS["body"],
            height=INPUT_STYLE["height"],
            corner_radius=INPUT_STYLE["corner_radius"],
            border_width=INPUT_STYLE["border_width"],
            border_color=self.colors["border"],
            fg_color=self.colors["input_bg"]
        )
        self.email_entry.pack(fill="x", pady=(0, 10))

        # Password input
        password_label = ctk.CTkLabel(
            parent,
            text="Password",
            font=FONTS["body_sm"],
            text_color=self.colors["text_secondary"],
            anchor="w"
        )
        password_label.pack(fill="x", pady=(0, 2))

        self.password_entry = ctk.CTkEntry(
            parent,
            placeholder_text="••••••••",
            font=FONTS["body"],
            show="•",
            height=INPUT_STYLE["height"],
            corner_radius=INPUT_STYLE["corner_radius"],
            border_width=INPUT_STYLE["border_width"],
            border_color=self.colors["border"],
            fg_color=self.colors["input_bg"]
        )
        self.password_entry.pack(fill="x", pady=(0, 15))

        # Login button
        login_btn = ctk.CTkButton(
            parent,
            text="Login",
            font=FONTS["body"],
            command=self._login_with_email,
            **BUTTON_STYLES["primary"]
        )
        login_btn.pack(fill="x", pady=(0, 10))

    def _show_token_help(self):
        """Show help for getting API token"""
        help_window = ctk.CTkToplevel(self)
        help_window.title("How to Get API Token")
        help_window.geometry("450x300")
        help_window.transient(self.parent)
        help_window.grab_set()

        # Center the window
        help_window.update_idletasks()
        x = self.parent.winfo_x() + (self.parent.winfo_width() - 450) // 2
        y = self.parent.winfo_y() + (self.parent.winfo_height() - 300) // 2
        help_window.geometry(f"+{x}+{y}")

        frame = ctk.CTkFrame(help_window, fg_color=self.colors["bg"])
        frame.pack(fill="both", expand=True, padx=20, pady=20)

        title = ctk.CTkLabel(
            frame,
            text="📋 How to Get Your API Token",
            font=FONTS["heading_sm"],
            text_color=self.colors["text"]
        )
        title.pack(pady=(0, 15))

        steps = [
            "1. Go to the web app and log in to your account",
            "2. Navigate to Settings or Account page",
            "3. Look for 'API Token' or 'Desktop App Token'",
            "4. Click 'Generate Token' or 'Copy Token'",
            "5. Paste the token in the app login screen"
        ]

        for step in steps:
            step_label = ctk.CTkLabel(
                frame,
                text=step,
                font=FONTS["body"],
                text_color=self.colors["text_secondary"],
                anchor="w"
            )
            step_label.pack(fill="x", pady=3)

        # Open website button
        open_btn = ctk.CTkButton(
            frame,
            text="Open Web App",
            font=FONTS["body"],
            command=lambda: webbrowser.open(API_BASE_URL),
            **BUTTON_STYLES["primary"]
        )
        open_btn.pack(pady=(20, 0))

    def _login_with_token(self):
        """Login using API token"""
        token = self.token_entry.get().strip()

        if not token:
            self._show_error("Please enter your API token")
            return

        self._show_error("")  # Clear error
        self._set_loading(True)

        # Validate token
        result = self.api.login_with_token(token)

        self._set_loading(False)

        if result.get("success"):
            self.on_login_success(result.get("user"), token if self.remember_var.get() else None)
        else:
            self._show_error(result.get("error", "Invalid token"))

    def _login_with_email(self):
        """Login using email and password"""
        email = self.email_entry.get().strip()
        password = self.password_entry.get()

        if not email:
            self._show_error("Please enter your email")
            return

        if not password:
            self._show_error("Please enter your password")
            return

        self._show_error("")  # Clear error
        self._set_loading(True)

        # Login
        result = self.api.login(email, password)

        self._set_loading(False)

        if result.get("success"):
            token = result.get("token")
            self.on_login_success(result.get("user"), token if self.remember_var.get() else None)
        else:
            self._show_error(result.get("error", "Login failed"))

    def _show_error(self, message: str):
        """Show error message"""
        self.error_label.configure(text=message)

    def _set_loading(self, loading: bool):
        """Set loading state"""
        state = "disabled" if loading else "normal"
        self.token_entry.configure(state=state)
        self.email_entry.configure(state=state)
        self.password_entry.configure(state=state)

    def destroy(self):
        """Clean up"""
        super().destroy()
