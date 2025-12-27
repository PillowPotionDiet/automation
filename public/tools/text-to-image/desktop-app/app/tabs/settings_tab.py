"""
Settings Tab - Application configuration
"""

import customtkinter as ctk
import os
import subprocess
import platform
import webbrowser
from app.theme import COLORS, FONTS, BUTTON_STYLES, INPUT_STYLE, get_theme_colors
from app.constants import APP_NAME, APP_VERSION, API_BASE_URL


class SettingsTab(ctk.CTkFrame):
    """Settings configuration tab"""

    def __init__(self, parent, api_service, config_service):
        super().__init__(parent, fg_color="transparent")
        self.api = api_service
        self.config = config_service
        self.colors = get_theme_colors("dark")

        self._create_widgets()

    def _create_widgets(self):
        """Create settings tab widgets"""
        # Scrollable container
        scroll = ctk.CTkScrollableFrame(self, fg_color="transparent")
        scroll.pack(fill="both", expand=True, padx=30, pady=20)

        # Header
        header = ctk.CTkLabel(
            scroll,
            text="Settings",
            font=FONTS["heading_lg"],
            text_color=self.colors["text"]
        )
        header.pack(anchor="w", pady=(0, 20))

        # Account Section
        account_card = ctk.CTkFrame(
            scroll,
            fg_color=self.colors["card"],
            corner_radius=12
        )
        account_card.pack(fill="x", pady=(0, 20))

        account_header = ctk.CTkLabel(
            account_card,
            text="👤 Account",
            font=FONTS["heading_sm"],
            text_color=self.colors["text"]
        )
        account_header.pack(anchor="w", padx=20, pady=(15, 10))

        # Email
        email_row = ctk.CTkFrame(account_card, fg_color="transparent")
        email_row.pack(fill="x", padx=20, pady=5)

        email_label = ctk.CTkLabel(
            email_row,
            text="Email:",
            font=FONTS["body"],
            text_color=self.colors["text_secondary"],
            width=100,
            anchor="w"
        )
        email_label.pack(side="left")

        email_value = ctk.CTkLabel(
            email_row,
            text=self.api.get_user_email(),
            font=FONTS["body"],
            text_color=self.colors["text"]
        )
        email_value.pack(side="left")

        # Credits
        credits_row = ctk.CTkFrame(account_card, fg_color="transparent")
        credits_row.pack(fill="x", padx=20, pady=5)

        credits_label = ctk.CTkLabel(
            credits_row,
            text="Credits:",
            font=FONTS["body"],
            text_color=self.colors["text_secondary"],
            width=100,
            anchor="w"
        )
        credits_label.pack(side="left")

        self.credits_value = ctk.CTkLabel(
            credits_row,
            text=str(self.api.get_user_credits()),
            font=FONTS["body"],
            text_color=self.colors["primary"]
        )
        self.credits_value.pack(side="left")

        sync_btn = ctk.CTkButton(
            credits_row,
            text="↻ Sync",
            font=FONTS["body_sm"],
            width=60,
            height=28,
            fg_color="transparent",
            hover_color=self.colors["card_hover"],
            text_color=self.colors["primary"],
            command=self._sync_credits
        )
        sync_btn.pack(side="left", padx=10)

        # Server
        server_row = ctk.CTkFrame(account_card, fg_color="transparent")
        server_row.pack(fill="x", padx=20, pady=(5, 15))

        server_label = ctk.CTkLabel(
            server_row,
            text="Server:",
            font=FONTS["body"],
            text_color=self.colors["text_secondary"],
            width=100,
            anchor="w"
        )
        server_label.pack(side="left")

        server_value = ctk.CTkLabel(
            server_row,
            text=API_BASE_URL.replace("https://", ""),
            font=FONTS["body_sm"],
            text_color=self.colors["text_secondary"]
        )
        server_value.pack(side="left")

        # Automation Section
        auto_card = ctk.CTkFrame(
            scroll,
            fg_color=self.colors["card"],
            corner_radius=12
        )
        auto_card.pack(fill="x", pady=(0, 20))

        auto_header = ctk.CTkLabel(
            auto_card,
            text="🤖 Automation",
            font=FONTS["heading_sm"],
            text_color=self.colors["text"]
        )
        auto_header.pack(anchor="w", padx=20, pady=(15, 10))

        # Default timeout
        timeout_row = ctk.CTkFrame(auto_card, fg_color="transparent")
        timeout_row.pack(fill="x", padx=20, pady=5)

        timeout_label = ctk.CTkLabel(
            timeout_row,
            text="Default Timeout:",
            font=FONTS["body"],
            text_color=self.colors["text_secondary"],
            width=150,
            anchor="w"
        )
        timeout_label.pack(side="left")

        self.timeout_entry = ctk.CTkEntry(
            timeout_row,
            width=80,
            font=FONTS["body"],
            height=35,
            corner_radius=6
        )
        self.timeout_entry.insert(0, str(self.config.get_timeout()))
        self.timeout_entry.pack(side="left")

        timeout_unit = ctk.CTkLabel(
            timeout_row,
            text="seconds",
            font=FONTS["body_sm"],
            text_color=self.colors["text_secondary"]
        )
        timeout_unit.pack(side="left", padx=10)

        # Default delay
        delay_row = ctk.CTkFrame(auto_card, fg_color="transparent")
        delay_row.pack(fill="x", padx=20, pady=5)

        delay_label = ctk.CTkLabel(
            delay_row,
            text="Delay Between Prompts:",
            font=FONTS["body"],
            text_color=self.colors["text_secondary"],
            width=150,
            anchor="w"
        )
        delay_label.pack(side="left")

        self.delay_entry = ctk.CTkEntry(
            delay_row,
            width=80,
            font=FONTS["body"],
            height=35,
            corner_radius=6
        )
        self.delay_entry.insert(0, str(self.config.get_delay()))
        self.delay_entry.pack(side="left")

        delay_unit = ctk.CTkLabel(
            delay_row,
            text="seconds",
            font=FONTS["body_sm"],
            text_color=self.colors["text_secondary"]
        )
        delay_unit.pack(side="left", padx=10)

        # Headless mode
        self.headless_var = ctk.BooleanVar(value=self.config.is_headless())
        headless_check = ctk.CTkCheckBox(
            auto_card,
            text="Run browser in headless mode (hidden)",
            font=FONTS["body"],
            variable=self.headless_var,
            fg_color=self.colors["primary"],
            hover_color=self.colors["primary_hover"]
        )
        headless_check.pack(anchor="w", padx=20, pady=(10, 15))

        # Appearance Section
        appear_card = ctk.CTkFrame(
            scroll,
            fg_color=self.colors["card"],
            corner_radius=12
        )
        appear_card.pack(fill="x", pady=(0, 20))

        appear_header = ctk.CTkLabel(
            appear_card,
            text="🎨 Appearance",
            font=FONTS["heading_sm"],
            text_color=self.colors["text"]
        )
        appear_header.pack(anchor="w", padx=20, pady=(15, 10))

        theme_row = ctk.CTkFrame(appear_card, fg_color="transparent")
        theme_row.pack(fill="x", padx=20, pady=(5, 15))

        theme_label = ctk.CTkLabel(
            theme_row,
            text="Theme:",
            font=FONTS["body"],
            text_color=self.colors["text_secondary"],
            width=100,
            anchor="w"
        )
        theme_label.pack(side="left")

        self.theme_var = ctk.StringVar(value=self.config.get_theme())
        theme_menu = ctk.CTkSegmentedButton(
            theme_row,
            values=["Dark", "Light", "System"],
            variable=self.theme_var,
            font=FONTS["body_sm"],
            fg_color=self.colors["bg_secondary"],
            selected_color=self.colors["primary"],
            selected_hover_color=self.colors["primary_hover"]
        )
        theme_menu.pack(side="left")

        # Storage Section
        storage_card = ctk.CTkFrame(
            scroll,
            fg_color=self.colors["card"],
            corner_radius=12
        )
        storage_card.pack(fill="x", pady=(0, 20))

        storage_header = ctk.CTkLabel(
            storage_card,
            text="📁 Storage",
            font=FONTS["heading_sm"],
            text_color=self.colors["text"]
        )
        storage_header.pack(anchor="w", padx=20, pady=(15, 10))

        # Output folder
        folder_row = ctk.CTkFrame(storage_card, fg_color="transparent")
        folder_row.pack(fill="x", padx=20, pady=5)

        folder_label = ctk.CTkLabel(
            folder_row,
            text="Output Folder:",
            font=FONTS["body"],
            text_color=self.colors["text_secondary"],
            width=100,
            anchor="w"
        )
        folder_label.pack(side="left")

        output_dir = str(self.config.get_images_dir())
        short_path = output_dir[:40] + "..." if len(output_dir) > 40 else output_dir
        folder_value = ctk.CTkLabel(
            folder_row,
            text=short_path,
            font=FONTS["body_sm"],
            text_color=self.colors["text"]
        )
        folder_value.pack(side="left", fill="x", expand=True)

        open_folder_btn = ctk.CTkButton(
            folder_row,
            text="Open",
            font=FONTS["body_sm"],
            width=60,
            height=28,
            command=self._open_output_folder,
            **BUTTON_STYLES["secondary"]
        )
        open_folder_btn.pack(side="right")

        # Clear cache
        cache_row = ctk.CTkFrame(storage_card, fg_color="transparent")
        cache_row.pack(fill="x", padx=20, pady=(10, 15))

        clear_cache_btn = ctk.CTkButton(
            cache_row,
            text="🗑️ Clear History",
            font=FONTS["body"],
            command=self._clear_history,
            **BUTTON_STYLES["secondary"]
        )
        clear_cache_btn.pack(side="left")

        # About Section
        about_card = ctk.CTkFrame(
            scroll,
            fg_color=self.colors["card"],
            corner_radius=12
        )
        about_card.pack(fill="x", pady=(0, 20))

        about_header = ctk.CTkLabel(
            about_card,
            text="ℹ️ About",
            font=FONTS["heading_sm"],
            text_color=self.colors["text"]
        )
        about_header.pack(anchor="w", padx=20, pady=(15, 10))

        version_row = ctk.CTkFrame(about_card, fg_color="transparent")
        version_row.pack(fill="x", padx=20, pady=5)

        version_label = ctk.CTkLabel(
            version_row,
            text=f"{APP_NAME} v{APP_VERSION}",
            font=FONTS["body"],
            text_color=self.colors["text"]
        )
        version_label.pack(side="left")

        # Links
        links_row = ctk.CTkFrame(about_card, fg_color="transparent")
        links_row.pack(fill="x", padx=20, pady=(10, 15))

        website_btn = ctk.CTkButton(
            links_row,
            text="🌐 Website",
            font=FONTS["body_sm"],
            width=100,
            command=lambda: webbrowser.open(API_BASE_URL),
            **BUTTON_STYLES["secondary"]
        )
        website_btn.pack(side="left", padx=(0, 10))

        # Save Button
        save_btn = ctk.CTkButton(
            scroll,
            text="💾 Save Settings",
            font=FONTS["body"],
            command=self._save_settings,
            **BUTTON_STYLES["success"]
        )
        save_btn.pack(fill="x", pady=10)

    def _sync_credits(self):
        """Sync credits with server"""
        balance = self.api.sync_credits()
        self.credits_value.configure(text=str(balance))

    def _open_output_folder(self):
        """Open output folder"""
        output_dir = self.config.get_images_dir()

        if platform.system() == "Windows":
            os.startfile(str(output_dir))
        elif platform.system() == "Darwin":
            subprocess.run(["open", str(output_dir)])
        else:
            subprocess.run(["xdg-open", str(output_dir)])

    def _clear_history(self):
        """Clear generation history"""
        self.config.clear_history()
        self._show_message("History cleared!")

    def _save_settings(self):
        """Save all settings"""
        try:
            timeout = int(self.timeout_entry.get())
            self.config.set("settings.timeout", timeout)
        except ValueError:
            pass

        try:
            delay = int(self.delay_entry.get())
            self.config.set("settings.delay", delay)
        except ValueError:
            pass

        self.config.set("settings.headless", self.headless_var.get())
        self.config.set("settings.theme", self.theme_var.get().lower())

        # Apply theme
        theme = self.theme_var.get().lower()
        if theme == "system":
            ctk.set_appearance_mode("system")
        else:
            ctk.set_appearance_mode(theme)

        self._show_message("Settings saved!")

    def _show_message(self, message: str):
        """Show a message"""
        dialog = ctk.CTkToplevel(self)
        dialog.title("Message")
        dialog.geometry("250x100")
        dialog.transient(self.winfo_toplevel())
        dialog.grab_set()

        # Center
        dialog.update_idletasks()
        x = self.winfo_toplevel().winfo_x() + (self.winfo_toplevel().winfo_width() - 250) // 2
        y = self.winfo_toplevel().winfo_y() + (self.winfo_toplevel().winfo_height() - 100) // 2
        dialog.geometry(f"+{x}+{y}")

        label = ctk.CTkLabel(dialog, text=message, font=FONTS["body"])
        label.pack(pady=20)

        ok_btn = ctk.CTkButton(
            dialog,
            text="OK",
            width=80,
            command=dialog.destroy,
            **BUTTON_STYLES["primary"]
        )
        ok_btn.pack()

    def refresh(self):
        """Refresh settings"""
        self._sync_credits()
