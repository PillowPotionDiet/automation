"""
Main Screen - Dashboard with tabbed interface
"""

import customtkinter as ctk
from typing import Callable
from app.theme import COLORS, FONTS, BUTTON_STYLES, get_theme_colors
from app.constants import APP_NAME
from app.tabs.home_tab import HomeTab
from app.tabs.generate_tab import GenerateTab
from app.tabs.gallery_tab import GalleryTab
from app.tabs.settings_tab import SettingsTab


class MainScreen(ctk.CTkFrame):
    """Main application screen with sidebar and tabs"""

    def __init__(self, parent, api_service, config_service, on_logout: Callable):
        super().__init__(parent, fg_color=COLORS["dark"]["bg"])
        self.parent = parent
        self.api = api_service
        self.config = config_service
        self.on_logout = on_logout
        self.colors = get_theme_colors("dark")

        self.current_tab = None
        self.tabs = {}

        self._create_widgets()
        self._show_tab("home")

    def _create_widgets(self):
        """Create main screen widgets"""
        # Sidebar
        self.sidebar = ctk.CTkFrame(
            self,
            fg_color=self.colors["bg_secondary"],
            width=220,
            corner_radius=0
        )
        self.sidebar.pack(side="left", fill="y")
        self.sidebar.pack_propagate(False)

        self._create_sidebar()

        # Main content area
        self.content = ctk.CTkFrame(
            self,
            fg_color=self.colors["bg"],
            corner_radius=0
        )
        self.content.pack(side="left", fill="both", expand=True)

        # Create tabs
        self._create_tabs()

        # Pack to fill parent
        self.pack(fill="both", expand=True)

    def _create_sidebar(self):
        """Create sidebar with navigation"""
        # Logo and title
        logo_frame = ctk.CTkFrame(self.sidebar, fg_color="transparent")
        logo_frame.pack(fill="x", padx=15, pady=20)

        logo_label = ctk.CTkLabel(
            logo_frame,
            text="🖼️",
            font=("Segoe UI Emoji", 32),
        )
        logo_label.pack(side="left")

        title_label = ctk.CTkLabel(
            logo_frame,
            text="Text to Image",
            font=FONTS["heading_sm"],
            text_color=self.colors["text"]
        )
        title_label.pack(side="left", padx=10)

        # Separator
        separator = ctk.CTkFrame(
            self.sidebar,
            fg_color=self.colors["border"],
            height=1
        )
        separator.pack(fill="x", padx=15, pady=10)

        # Navigation buttons
        self.nav_buttons = {}

        nav_items = [
            ("home", "🏠", "Home"),
            ("generate", "✨", "Generate"),
            ("gallery", "🖼️", "Gallery"),
            ("settings", "⚙️", "Settings"),
        ]

        for tab_id, icon, label in nav_items:
            btn = ctk.CTkButton(
                self.sidebar,
                text=f"  {icon}   {label}",
                font=FONTS["body"],
                fg_color="transparent",
                hover_color=self.colors["card_hover"],
                text_color=self.colors["text_secondary"],
                anchor="w",
                height=45,
                corner_radius=8,
                command=lambda t=tab_id: self._show_tab(t)
            )
            btn.pack(fill="x", padx=10, pady=2)
            self.nav_buttons[tab_id] = btn

        # Spacer
        spacer = ctk.CTkFrame(self.sidebar, fg_color="transparent")
        spacer.pack(fill="both", expand=True)

        # Credits display
        credits_frame = ctk.CTkFrame(
            self.sidebar,
            fg_color=self.colors["card"],
            corner_radius=12
        )
        credits_frame.pack(fill="x", padx=15, pady=10)

        credits_label = ctk.CTkLabel(
            credits_frame,
            text="💎 Credits",
            font=FONTS["body_sm"],
            text_color=self.colors["text_secondary"]
        )
        credits_label.pack(pady=(10, 2))

        self.credits_value = ctk.CTkLabel(
            credits_frame,
            text=str(self.api.get_user_credits()),
            font=FONTS["heading_md"],
            text_color=self.colors["primary"]
        )
        self.credits_value.pack(pady=(0, 5))

        sync_btn = ctk.CTkButton(
            credits_frame,
            text="↻ Sync",
            font=FONTS["caption"],
            fg_color="transparent",
            hover_color=self.colors["card_hover"],
            text_color=self.colors["text_secondary"],
            height=25,
            command=self._sync_credits
        )
        sync_btn.pack(pady=(0, 10))

        # User info
        user_frame = ctk.CTkFrame(self.sidebar, fg_color="transparent")
        user_frame.pack(fill="x", padx=15, pady=15)

        user_email = self.api.get_user_email()
        email_label = ctk.CTkLabel(
            user_frame,
            text=user_email[:25] + "..." if len(user_email) > 25 else user_email,
            font=FONTS["body_sm"],
            text_color=self.colors["text_secondary"]
        )
        email_label.pack()

        logout_btn = ctk.CTkButton(
            user_frame,
            text="Logout",
            font=FONTS["body_sm"],
            fg_color="transparent",
            hover_color=self.colors["error"],
            text_color=self.colors["error"],
            height=30,
            command=self._handle_logout
        )
        logout_btn.pack(pady=(5, 0))

    def _create_tabs(self):
        """Create all tab frames"""
        self.tabs["home"] = HomeTab(
            self.content,
            self.api,
            self.config,
            on_navigate=self._show_tab
        )

        self.tabs["generate"] = GenerateTab(
            self.content,
            self.api,
            self.config,
            on_credits_update=self._update_credits
        )

        self.tabs["gallery"] = GalleryTab(
            self.content,
            self.config
        )

        self.tabs["settings"] = SettingsTab(
            self.content,
            self.api,
            self.config
        )

    def _show_tab(self, tab_id: str):
        """Show a specific tab"""
        if self.current_tab:
            self.current_tab.pack_forget()

        # Update nav button styles
        for btn_id, btn in self.nav_buttons.items():
            if btn_id == tab_id:
                btn.configure(
                    fg_color=self.colors["primary"],
                    text_color="#ffffff"
                )
            else:
                btn.configure(
                    fg_color="transparent",
                    text_color=self.colors["text_secondary"]
                )

        # Show selected tab
        if tab_id in self.tabs:
            self.current_tab = self.tabs[tab_id]
            self.current_tab.pack(fill="both", expand=True)

            # Refresh tab if it has refresh method
            if hasattr(self.current_tab, "refresh"):
                self.current_tab.refresh()

    def _sync_credits(self):
        """Sync credits with server"""
        balance = self.api.sync_credits()
        self._update_credits(balance)

    def _update_credits(self, balance: int):
        """Update credits display"""
        self.credits_value.configure(text=str(balance))

    def _handle_logout(self):
        """Handle logout"""
        self.on_logout()

    def destroy(self):
        """Clean up"""
        for tab in self.tabs.values():
            if hasattr(tab, "cleanup"):
                tab.cleanup()
        super().destroy()
