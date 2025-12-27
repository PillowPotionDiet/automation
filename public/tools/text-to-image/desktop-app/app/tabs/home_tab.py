"""
Home Tab - Dashboard with stats and quick actions
"""

import customtkinter as ctk
from typing import Callable
from app.theme import COLORS, FONTS, BUTTON_STYLES, get_theme_colors


class HomeTab(ctk.CTkFrame):
    """Home dashboard tab"""

    def __init__(self, parent, api_service, config_service, on_navigate: Callable):
        super().__init__(parent, fg_color="transparent")
        self.api = api_service
        self.config = config_service
        self.on_navigate = on_navigate
        self.colors = get_theme_colors("dark")

        self._create_widgets()

    def _create_widgets(self):
        """Create home tab widgets"""
        # Header
        header = ctk.CTkFrame(self, fg_color="transparent")
        header.pack(fill="x", padx=30, pady=(30, 20))

        welcome_text = f"Welcome, {self.api.get_user_email().split('@')[0]}!"
        welcome_label = ctk.CTkLabel(
            header,
            text=welcome_text,
            font=FONTS["heading_lg"],
            text_color=self.colors["text"]
        )
        welcome_label.pack(anchor="w")

        subtitle = ctk.CTkLabel(
            header,
            text="Generate amazing images with Google Flow automation",
            font=FONTS["body"],
            text_color=self.colors["text_secondary"]
        )
        subtitle.pack(anchor="w", pady=(5, 0))

        # Stats cards row
        stats_frame = ctk.CTkFrame(self, fg_color="transparent")
        stats_frame.pack(fill="x", padx=30, pady=10)

        # Credits card
        credits_card = self._create_stat_card(
            stats_frame,
            "💎 Credits",
            str(self.api.get_user_credits()),
            "Available for generation"
        )
        credits_card.pack(side="left", padx=(0, 15), fill="both", expand=True)

        # Prompts card
        prompt_count = len(self.config.get_prompts())
        prompts_card = self._create_stat_card(
            stats_frame,
            "📝 Prompts",
            str(prompt_count),
            "Ready to generate"
        )
        prompts_card.pack(side="left", padx=(0, 15), fill="both", expand=True)

        # Images card
        images_dir = self.config.get_images_dir()
        image_count = len(list(images_dir.glob("*.png"))) + len(list(images_dir.glob("*.jpg")))
        images_card = self._create_stat_card(
            stats_frame,
            "🖼️ Images",
            str(image_count),
            "Generated images"
        )
        images_card.pack(side="left", fill="both", expand=True)

        # Quick actions
        actions_frame = ctk.CTkFrame(self, fg_color="transparent")
        actions_frame.pack(fill="x", padx=30, pady=20)

        actions_label = ctk.CTkLabel(
            actions_frame,
            text="Quick Actions",
            font=FONTS["heading_sm"],
            text_color=self.colors["text"]
        )
        actions_label.pack(anchor="w", pady=(0, 15))

        buttons_frame = ctk.CTkFrame(actions_frame, fg_color="transparent")
        buttons_frame.pack(fill="x")

        # Generate button
        generate_btn = ctk.CTkButton(
            buttons_frame,
            text="✨ New Generation",
            font=FONTS["body"],
            command=lambda: self.on_navigate("generate"),
            **BUTTON_STYLES["primary"],
            width=180
        )
        generate_btn.pack(side="left", padx=(0, 10))

        # Gallery button
        gallery_btn = ctk.CTkButton(
            buttons_frame,
            text="🖼️ View Gallery",
            font=FONTS["body"],
            command=lambda: self.on_navigate("gallery"),
            **BUTTON_STYLES["secondary"],
            width=180
        )
        gallery_btn.pack(side="left", padx=(0, 10))

        # Open folder button
        folder_btn = ctk.CTkButton(
            buttons_frame,
            text="📁 Open Output Folder",
            font=FONTS["body"],
            command=self._open_output_folder,
            **BUTTON_STYLES["secondary"],
            width=180
        )
        folder_btn.pack(side="left")

        # Recent activity
        recent_frame = ctk.CTkFrame(
            self,
            fg_color=self.colors["card"],
            corner_radius=12
        )
        recent_frame.pack(fill="both", expand=True, padx=30, pady=(10, 30))

        recent_header = ctk.CTkFrame(recent_frame, fg_color="transparent")
        recent_header.pack(fill="x", padx=20, pady=15)

        recent_label = ctk.CTkLabel(
            recent_header,
            text="📋 Recent Activity",
            font=FONTS["heading_sm"],
            text_color=self.colors["text"]
        )
        recent_label.pack(side="left")

        # Recent generations list
        recent_list = ctk.CTkScrollableFrame(
            recent_frame,
            fg_color="transparent",
            height=200
        )
        recent_list.pack(fill="both", expand=True, padx=15, pady=(0, 15))

        recent_gens = self.config.get_recent_generations(5)

        if recent_gens:
            for gen in recent_gens:
                self._create_activity_item(recent_list, gen)
        else:
            empty_label = ctk.CTkLabel(
                recent_list,
                text="No recent activity. Start generating images!",
                font=FONTS["body"],
                text_color=self.colors["text_secondary"]
            )
            empty_label.pack(pady=30)

    def _create_stat_card(self, parent, title: str, value: str, subtitle: str):
        """Create a stat card"""
        card = ctk.CTkFrame(
            parent,
            fg_color=self.colors["card"],
            corner_radius=12,
            height=120
        )

        title_label = ctk.CTkLabel(
            card,
            text=title,
            font=FONTS["body_sm"],
            text_color=self.colors["text_secondary"]
        )
        title_label.pack(pady=(20, 5))

        value_label = ctk.CTkLabel(
            card,
            text=value,
            font=FONTS["heading_lg"],
            text_color=self.colors["primary"]
        )
        value_label.pack()

        subtitle_label = ctk.CTkLabel(
            card,
            text=subtitle,
            font=FONTS["caption"],
            text_color=self.colors["text_secondary"]
        )
        subtitle_label.pack(pady=(5, 20))

        return card

    def _create_activity_item(self, parent, generation: dict):
        """Create an activity item"""
        item = ctk.CTkFrame(
            parent,
            fg_color=self.colors["bg_secondary"],
            corner_radius=8,
            height=50
        )
        item.pack(fill="x", pady=3)
        item.pack_propagate(False)

        content = ctk.CTkFrame(item, fg_color="transparent")
        content.pack(fill="both", expand=True, padx=15, pady=10)

        prompt = generation.get("prompt", "Unknown")[:50]
        prompt_label = ctk.CTkLabel(
            content,
            text=f"🖼️ {prompt}...",
            font=FONTS["body_sm"],
            text_color=self.colors["text"],
            anchor="w"
        )
        prompt_label.pack(side="left")

        timestamp = generation.get("timestamp", "")[:10]
        time_label = ctk.CTkLabel(
            content,
            text=timestamp,
            font=FONTS["caption"],
            text_color=self.colors["text_secondary"]
        )
        time_label.pack(side="right")

    def _open_output_folder(self):
        """Open the output folder in file explorer"""
        import os
        import subprocess
        import platform

        output_dir = self.config.get_images_dir()

        if platform.system() == "Windows":
            os.startfile(str(output_dir))
        elif platform.system() == "Darwin":  # macOS
            subprocess.run(["open", str(output_dir)])
        else:  # Linux
            subprocess.run(["xdg-open", str(output_dir)])

    def refresh(self):
        """Refresh the tab data"""
        # Update credits
        # This could be expanded to refresh all stats
        pass
