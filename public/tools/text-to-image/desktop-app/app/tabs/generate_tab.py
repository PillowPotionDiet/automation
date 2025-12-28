"""
Generate Tab - Prompt entry and image generation
"""

import customtkinter as ctk
import threading
import uuid
from typing import Callable, Optional, List
from datetime import datetime
from app.theme import COLORS, FONTS, BUTTON_STYLES, INPUT_STYLE, get_theme_colors
from app.constants import CREDITS_PER_IMAGE


# Available style tags
STYLE_TAGS = [
    "35mm film",
    "Minimal",
    "Handmade",
    "Sketchy",
    "Abstract",
    "Painting",
    "DSLR",
    "Editorial photo",
    "Natural light"
]

# Available aspect ratios
ASPECT_RATIOS = [
    "Square",
    "Portrait (9:16)",
    "Landscape (16:9)",
    "Mobile portrait (3:4)",
    "Mobile landscape (4:3)"
]


class GenerateTab(ctk.CTkFrame):
    """Image generation tab"""

    def __init__(self, parent, api_service, config_service, on_credits_update: Callable, on_generation_complete: Callable = None):
        super().__init__(parent, fg_color="transparent")
        self.api = api_service
        self.config = config_service
        self.on_credits_update = on_credits_update
        self.on_generation_complete = on_generation_complete
        self.colors = get_theme_colors("dark")

        self.is_generating = False
        self.generation_thread: Optional[threading.Thread] = None
        self.stop_requested = False

        # New features state
        self.selected_style_tags: List[str] = []
        self.selected_aspect_ratio = "Square"
        self.lock_seed = False
        self.current_project_id = str(uuid.uuid4())[:8]
        self.current_project_name = f"Project {datetime.now().strftime('%Y%m%d_%H%M')}"

        self._create_widgets()
        self._load_saved_data()

    def _create_widgets(self):
        """Create generate tab widgets"""
        # Scrollable container
        scroll = ctk.CTkScrollableFrame(self, fg_color="transparent")
        scroll.pack(fill="both", expand=True, padx=30, pady=20)

        # Header
        header = ctk.CTkLabel(
            scroll,
            text="Generate Images",
            font=FONTS["heading_lg"],
            text_color=self.colors["text"]
        )
        header.pack(anchor="w", pady=(0, 20))

        # Google Account Section
        google_card = ctk.CTkFrame(
            scroll,
            fg_color=self.colors["card"],
            corner_radius=12
        )
        google_card.pack(fill="x", pady=(0, 20))

        google_header = ctk.CTkLabel(
            google_card,
            text="🔐 Google Account",
            font=FONTS["heading_sm"],
            text_color=self.colors["text"]
        )
        google_header.pack(anchor="w", padx=20, pady=(15, 10))

        google_info = ctk.CTkLabel(
            google_card,
            text="Enter your Google credentials for automatic login to ImageFX",
            font=FONTS["body_sm"],
            text_color=self.colors["text_secondary"]
        )
        google_info.pack(anchor="w", padx=20)

        # Email input
        email_frame = ctk.CTkFrame(google_card, fg_color="transparent")
        email_frame.pack(fill="x", padx=20, pady=(15, 0))

        email_label = ctk.CTkLabel(
            email_frame,
            text="Email",
            font=FONTS["body_sm"],
            text_color=self.colors["text_secondary"]
        )
        email_label.pack(anchor="w")

        self.google_email = ctk.CTkEntry(
            email_frame,
            placeholder_text="your-email@gmail.com",
            font=FONTS["body"],
            height=INPUT_STYLE["height"],
            corner_radius=INPUT_STYLE["corner_radius"],
            border_width=INPUT_STYLE["border_width"],
            border_color=self.colors["border"],
            fg_color=self.colors["input_bg"]
        )
        self.google_email.pack(fill="x", pady=(5, 0))

        # Password input
        password_frame = ctk.CTkFrame(google_card, fg_color="transparent")
        password_frame.pack(fill="x", padx=20, pady=(10, 0))

        password_label = ctk.CTkLabel(
            password_frame,
            text="Password",
            font=FONTS["body_sm"],
            text_color=self.colors["text_secondary"]
        )
        password_label.pack(anchor="w")

        password_input_frame = ctk.CTkFrame(password_frame, fg_color="transparent")
        password_input_frame.pack(fill="x", pady=(5, 0))

        self.google_password = ctk.CTkEntry(
            password_input_frame,
            placeholder_text="••••••••",
            font=FONTS["body"],
            show="•",
            height=INPUT_STYLE["height"],
            corner_radius=INPUT_STYLE["corner_radius"],
            border_width=INPUT_STYLE["border_width"],
            border_color=self.colors["border"],
            fg_color=self.colors["input_bg"]
        )
        self.google_password.pack(side="left", fill="x", expand=True)

        # Manual login checkbox
        self.manual_login_var = ctk.BooleanVar(value=False)
        manual_check = ctk.CTkCheckBox(
            google_card,
            text="Use manual login (enter credentials in browser)",
            font=FONTS["body_sm"],
            variable=self.manual_login_var,
            fg_color=self.colors["primary"],
            hover_color=self.colors["primary_hover"],
            command=self._toggle_manual_login
        )
        manual_check.pack(anchor="w", padx=20, pady=15)

        # 2FA info
        tfa_info = ctk.CTkFrame(
            google_card,
            fg_color=self.colors["bg_secondary"],
            corner_radius=8
        )
        tfa_info.pack(fill="x", padx=20, pady=(0, 15))

        tfa_label = ctk.CTkLabel(
            tfa_info,
            text="💡 2FA Supported: If your account has 2FA, the tool will pause and wait for you to complete verification in the browser.",
            font=FONTS["caption"],
            text_color=self.colors["text_secondary"],
            wraplength=500,
            justify="left"
        )
        tfa_label.pack(padx=15, pady=10)

        # Prompts Section
        prompts_card = ctk.CTkFrame(
            scroll,
            fg_color=self.colors["card"],
            corner_radius=12
        )
        prompts_card.pack(fill="x", pady=(0, 20))

        prompts_header = ctk.CTkFrame(prompts_card, fg_color="transparent")
        prompts_header.pack(fill="x", padx=20, pady=15)

        prompts_label = ctk.CTkLabel(
            prompts_header,
            text="✨ Prompts",
            font=FONTS["heading_sm"],
            text_color=self.colors["text"]
        )
        prompts_label.pack(side="left")

        self.prompts_count = ctk.CTkLabel(
            prompts_header,
            text="(0)",
            font=FONTS["body"],
            text_color=self.colors["text_secondary"]
        )
        self.prompts_count.pack(side="left", padx=5)

        # Add prompt input
        input_frame = ctk.CTkFrame(prompts_card, fg_color="transparent")
        input_frame.pack(fill="x", padx=20, pady=(0, 10))

        self.prompt_entry = ctk.CTkEntry(
            input_frame,
            placeholder_text="A magical forest with glowing mushrooms, fantasy art, 8k...",
            font=FONTS["body"],
            height=INPUT_STYLE["height"],
            corner_radius=INPUT_STYLE["corner_radius"],
            border_width=INPUT_STYLE["border_width"],
            border_color=self.colors["border"],
            fg_color=self.colors["input_bg"]
        )
        self.prompt_entry.pack(side="left", fill="x", expand=True, padx=(0, 10))
        self.prompt_entry.bind("<Return>", lambda e: self._add_prompt())

        add_btn = ctk.CTkButton(
            input_frame,
            text="+ Add",
            font=FONTS["body"],
            width=80,
            command=self._add_prompt,
            **BUTTON_STYLES["primary"]
        )
        add_btn.pack(side="left")

        # Prompts list
        self.prompts_list = ctk.CTkScrollableFrame(
            prompts_card,
            fg_color="transparent",
            height=150
        )
        self.prompts_list.pack(fill="x", padx=20, pady=(0, 10))

        # Quick actions
        actions_frame = ctk.CTkFrame(prompts_card, fg_color="transparent")
        actions_frame.pack(fill="x", padx=20, pady=(0, 15))

        samples_btn = ctk.CTkButton(
            actions_frame,
            text="+ Add Samples",
            font=FONTS["body_sm"],
            width=120,
            command=self._add_samples,
            **BUTTON_STYLES["secondary"]
        )
        samples_btn.pack(side="left", padx=(0, 10))

        clear_btn = ctk.CTkButton(
            actions_frame,
            text="Clear All",
            font=FONTS["body_sm"],
            width=100,
            command=self._clear_prompts,
            **BUTTON_STYLES["secondary"]
        )
        clear_btn.pack(side="left")

        # Project Section
        project_card = ctk.CTkFrame(
            scroll,
            fg_color=self.colors["card"],
            corner_radius=12
        )
        project_card.pack(fill="x", pady=(0, 20))

        project_header = ctk.CTkFrame(project_card, fg_color="transparent")
        project_header.pack(fill="x", padx=20, pady=15)

        project_label = ctk.CTkLabel(
            project_header,
            text="📁 Project",
            font=FONTS["heading_sm"],
            text_color=self.colors["text"]
        )
        project_label.pack(side="left")

        new_project_btn = ctk.CTkButton(
            project_header,
            text="+ New Project",
            font=FONTS["body_sm"],
            width=120,
            command=self._new_project,
            **BUTTON_STYLES["secondary"]
        )
        new_project_btn.pack(side="right")

        # Project name input
        project_name_frame = ctk.CTkFrame(project_card, fg_color="transparent")
        project_name_frame.pack(fill="x", padx=20, pady=(0, 15))

        project_name_label = ctk.CTkLabel(
            project_name_frame,
            text="Project Name",
            font=FONTS["body_sm"],
            text_color=self.colors["text_secondary"]
        )
        project_name_label.pack(anchor="w")

        self.project_name_entry = ctk.CTkEntry(
            project_name_frame,
            placeholder_text="Enter project name...",
            font=FONTS["body"],
            height=INPUT_STYLE["height"],
            corner_radius=INPUT_STYLE["corner_radius"],
            border_width=INPUT_STYLE["border_width"],
            border_color=self.colors["border"],
            fg_color=self.colors["input_bg"]
        )
        self.project_name_entry.insert(0, self.current_project_name)
        self.project_name_entry.pack(fill="x", pady=(5, 0))

        # Seed lock option
        seed_frame = ctk.CTkFrame(project_card, fg_color="transparent")
        seed_frame.pack(fill="x", padx=20, pady=(0, 15))

        self.lock_seed_var = ctk.BooleanVar(value=False)
        seed_check = ctk.CTkCheckBox(
            seed_frame,
            text="Lock Seed (maintain character consistency across all prompts)",
            font=FONTS["body_sm"],
            variable=self.lock_seed_var,
            fg_color=self.colors["primary"],
            hover_color=self.colors["primary_hover"]
        )
        seed_check.pack(anchor="w")

        seed_info = ctk.CTkLabel(
            seed_frame,
            text="When enabled, the seed from the first generation will be locked for all subsequent prompts in this project",
            font=FONTS["caption"],
            text_color=self.colors["text_secondary"],
            wraplength=500,
            justify="left"
        )
        seed_info.pack(anchor="w", pady=(5, 0))

        # Style Tags Section
        style_card = ctk.CTkFrame(
            scroll,
            fg_color=self.colors["card"],
            corner_radius=12
        )
        style_card.pack(fill="x", pady=(0, 20))

        style_header = ctk.CTkLabel(
            style_card,
            text="🎨 Style Tags",
            font=FONTS["heading_sm"],
            text_color=self.colors["text"]
        )
        style_header.pack(anchor="w", padx=20, pady=(15, 5))

        style_info = ctk.CTkLabel(
            style_card,
            text="Select one or more style tags to apply to your images",
            font=FONTS["body_sm"],
            text_color=self.colors["text_secondary"]
        )
        style_info.pack(anchor="w", padx=20, pady=(0, 10))

        # Style tags grid
        style_tags_frame = ctk.CTkFrame(style_card, fg_color="transparent")
        style_tags_frame.pack(fill="x", padx=20, pady=(0, 15))

        self.style_tag_buttons = {}
        row_frame = None
        for i, tag in enumerate(STYLE_TAGS):
            if i % 3 == 0:
                row_frame = ctk.CTkFrame(style_tags_frame, fg_color="transparent")
                row_frame.pack(fill="x", pady=2)

            btn = ctk.CTkButton(
                row_frame,
                text=tag,
                font=FONTS["body_sm"],
                width=150,
                height=32,
                corner_radius=16,
                fg_color=self.colors["bg_secondary"],
                hover_color=self.colors["primary"],
                text_color=self.colors["text"],
                command=lambda t=tag: self._toggle_style_tag(t)
            )
            btn.pack(side="left", padx=5, pady=2)
            self.style_tag_buttons[tag] = btn

        # Aspect Ratio Section
        ratio_card = ctk.CTkFrame(
            scroll,
            fg_color=self.colors["card"],
            corner_radius=12
        )
        ratio_card.pack(fill="x", pady=(0, 20))

        ratio_header = ctk.CTkLabel(
            ratio_card,
            text="📐 Aspect Ratio",
            font=FONTS["heading_sm"],
            text_color=self.colors["text"]
        )
        ratio_header.pack(anchor="w", padx=20, pady=(15, 10))

        ratio_frame = ctk.CTkFrame(ratio_card, fg_color="transparent")
        ratio_frame.pack(fill="x", padx=20, pady=(0, 15))

        self.aspect_ratio_var = ctk.StringVar(value="Square")
        self.aspect_ratio_dropdown = ctk.CTkOptionMenu(
            ratio_frame,
            values=ASPECT_RATIOS,
            variable=self.aspect_ratio_var,
            font=FONTS["body"],
            width=200,
            height=35,
            corner_radius=8,
            fg_color=self.colors["input_bg"],
            button_color=self.colors["primary"],
            button_hover_color=self.colors["primary_hover"],
            dropdown_fg_color=self.colors["card"],
            dropdown_hover_color=self.colors["primary"]
        )
        self.aspect_ratio_dropdown.pack(side="left")

        # Aspect ratio preview icons
        ratio_icons = ctk.CTkFrame(ratio_frame, fg_color="transparent")
        ratio_icons.pack(side="left", padx=20)

        ratio_labels = {
            "Square": "1:1",
            "Portrait (9:16)": "9:16",
            "Landscape (16:9)": "16:9",
            "Mobile portrait (3:4)": "3:4",
            "Mobile landscape (4:3)": "4:3"
        }

        self.ratio_info_label = ctk.CTkLabel(
            ratio_icons,
            text="1:1 - Square format",
            font=FONTS["body_sm"],
            text_color=self.colors["text_secondary"]
        )
        self.ratio_info_label.pack(side="left")

        # Update ratio info when selection changes
        self.aspect_ratio_var.trace_add("write", self._on_ratio_change)

        # Settings Section
        settings_card = ctk.CTkFrame(
            scroll,
            fg_color=self.colors["card"],
            corner_radius=12
        )
        settings_card.pack(fill="x", pady=(0, 20))

        settings_header = ctk.CTkLabel(
            settings_card,
            text="⚙️ Settings",
            font=FONTS["heading_sm"],
            text_color=self.colors["text"]
        )
        settings_header.pack(anchor="w", padx=20, pady=15)

        settings_row = ctk.CTkFrame(settings_card, fg_color="transparent")
        settings_row.pack(fill="x", padx=20, pady=(0, 15))

        # Timeout
        timeout_frame = ctk.CTkFrame(settings_row, fg_color="transparent")
        timeout_frame.pack(side="left", padx=(0, 30))

        timeout_label = ctk.CTkLabel(
            timeout_frame,
            text="Timeout (sec)",
            font=FONTS["body_sm"],
            text_color=self.colors["text_secondary"]
        )
        timeout_label.pack(anchor="w")

        self.timeout_entry = ctk.CTkEntry(
            timeout_frame,
            width=80,
            font=FONTS["body"],
            height=35,
            corner_radius=6
        )
        self.timeout_entry.insert(0, str(self.config.get_timeout()))
        self.timeout_entry.pack(pady=(5, 0))

        # Delay
        delay_frame = ctk.CTkFrame(settings_row, fg_color="transparent")
        delay_frame.pack(side="left", padx=(0, 30))

        delay_label = ctk.CTkLabel(
            delay_frame,
            text="Delay (sec)",
            font=FONTS["body_sm"],
            text_color=self.colors["text_secondary"]
        )
        delay_label.pack(anchor="w")

        self.delay_entry = ctk.CTkEntry(
            delay_frame,
            width=80,
            font=FONTS["body"],
            height=35,
            corner_radius=6
        )
        self.delay_entry.insert(0, str(self.config.get_delay()))
        self.delay_entry.pack(pady=(5, 0))

        # Headless
        self.headless_var = ctk.BooleanVar(value=self.config.is_headless())
        headless_check = ctk.CTkCheckBox(
            settings_row,
            text="Headless mode (hidden browser)",
            font=FONTS["body_sm"],
            variable=self.headless_var,
            fg_color=self.colors["primary"],
            hover_color=self.colors["primary_hover"]
        )
        headless_check.pack(side="left", pady=(20, 0))

        # Generate Button
        self.generate_frame = ctk.CTkFrame(scroll, fg_color="transparent")
        self.generate_frame.pack(fill="x", pady=10)

        # Credits info
        prompts = self.config.get_prompts()
        credits_needed = len(prompts) * CREDITS_PER_IMAGE
        self.credits_info = ctk.CTkLabel(
            self.generate_frame,
            text=f"Credits needed: {credits_needed} ({len(prompts)} images × {CREDITS_PER_IMAGE} credits)",
            font=FONTS["body_sm"],
            text_color=self.colors["text_secondary"]
        )
        self.credits_info.pack(pady=(0, 10))

        self.generate_btn = ctk.CTkButton(
            self.generate_frame,
            text="Start Generation",
            font=FONTS["heading_sm"],
            command=self._start_generation,
            fg_color=COLORS["success"],
            hover_color=COLORS["success_hover"],
            text_color="#ffffff",
            corner_radius=8,
            height=50
        )
        self.generate_btn.pack(fill="x")

        # Progress section (hidden initially)
        self.progress_frame = ctk.CTkFrame(
            scroll,
            fg_color=self.colors["card"],
            corner_radius=12
        )

        self.progress_label = ctk.CTkLabel(
            self.progress_frame,
            text="Generating images...",
            font=FONTS["heading_sm"],
            text_color=self.colors["text"]
        )
        self.progress_label.pack(pady=(20, 10))

        self.progress_bar = ctk.CTkProgressBar(
            self.progress_frame,
            width=400,
            height=15,
            progress_color=self.colors["primary"]
        )
        self.progress_bar.pack(pady=10)
        self.progress_bar.set(0)

        self.progress_text = ctk.CTkLabel(
            self.progress_frame,
            text="0%",
            font=FONTS["body"],
            text_color=self.colors["text_secondary"]
        )
        self.progress_text.pack()

        self.current_prompt_label = ctk.CTkLabel(
            self.progress_frame,
            text="",
            font=FONTS["body_sm"],
            text_color=self.colors["text_secondary"],
            wraplength=450
        )
        self.current_prompt_label.pack(pady=10)

        # Log output
        self.log_output = ctk.CTkTextbox(
            self.progress_frame,
            height=150,
            font=FONTS["mono"],
            fg_color=self.colors["bg_secondary"],
            text_color=self.colors["text"]
        )
        self.log_output.pack(fill="x", padx=20, pady=10)

        self.stop_btn = ctk.CTkButton(
            self.progress_frame,
            text="⏹ Stop",
            font=FONTS["body"],
            command=self._stop_generation,
            **BUTTON_STYLES["danger"]
        )
        self.stop_btn.pack(pady=(10, 20))

    def _load_saved_data(self):
        """Load saved configuration data"""
        # Load Google credentials
        email = self.config.get("google_email", "")
        password = self.config.get_secure("google_password")

        if email:
            self.google_email.insert(0, email)
        if password:
            self.google_password.insert(0, password)

        # Load prompts
        self._refresh_prompts_list()

    def _toggle_manual_login(self):
        """Toggle manual login mode"""
        manual = self.manual_login_var.get()
        state = "disabled" if manual else "normal"
        self.google_email.configure(state=state)
        self.google_password.configure(state=state)

    def _new_project(self):
        """Start a new project"""
        self.current_project_id = str(uuid.uuid4())[:8]
        self.current_project_name = f"Project {datetime.now().strftime('%Y%m%d_%H%M')}"
        self.project_name_entry.delete(0, "end")
        self.project_name_entry.insert(0, self.current_project_name)

        # Clear prompts for new project
        self.config.clear_prompts()
        self._refresh_prompts_list()

        # Reset style tags
        self.selected_style_tags = []
        for tag, btn in self.style_tag_buttons.items():
            btn.configure(fg_color=self.colors["bg_secondary"])

        # Reset aspect ratio
        self.aspect_ratio_var.set("Square")

        # Reset seed lock
        self.lock_seed_var.set(False)

        self._show_message("New project started! Add your prompts.")

    def _toggle_style_tag(self, tag: str):
        """Toggle a style tag selection"""
        if tag in self.selected_style_tags:
            self.selected_style_tags.remove(tag)
            self.style_tag_buttons[tag].configure(fg_color=self.colors["bg_secondary"])
        else:
            self.selected_style_tags.append(tag)
            self.style_tag_buttons[tag].configure(fg_color=self.colors["primary"])

    def _on_ratio_change(self, *args):
        """Handle aspect ratio change"""
        ratio = self.aspect_ratio_var.get()
        ratio_info = {
            "Square": "1:1 - Square format",
            "Portrait (9:16)": "9:16 - Vertical/Phone screens",
            "Landscape (16:9)": "16:9 - Widescreen/TV",
            "Mobile portrait (3:4)": "3:4 - Mobile portrait",
            "Mobile landscape (4:3)": "4:3 - Mobile landscape"
        }
        self.ratio_info_label.configure(text=ratio_info.get(ratio, ""))

    def _add_prompt(self):
        """Add a new prompt"""
        prompt = self.prompt_entry.get().strip()
        if prompt:
            self.config.add_prompt(prompt)
            self.prompt_entry.delete(0, "end")
            self._refresh_prompts_list()

    def _remove_prompt(self, index: int):
        """Remove a prompt"""
        self.config.remove_prompt(index)
        self._refresh_prompts_list()

    def _add_samples(self):
        """Add sample prompts"""
        samples = [
            "A magical forest with glowing mushrooms, fantasy art, 8k ultra detailed",
            "A golden dragon in a crystal cave, cinematic lighting, epic fantasy",
            "A futuristic city at sunset, cyberpunk style, neon lights, 4k"
        ]
        for sample in samples:
            self.config.add_prompt(sample)
        self._refresh_prompts_list()

    def _clear_prompts(self):
        """Clear all prompts"""
        self.config.clear_prompts()
        self._refresh_prompts_list()

    def _refresh_prompts_list(self):
        """Refresh the prompts list display"""
        # Clear existing items
        for widget in self.prompts_list.winfo_children():
            widget.destroy()

        prompts = self.config.get_prompts()
        self.prompts_count.configure(text=f"({len(prompts)})")

        # Update credits info
        credits_needed = len(prompts) * CREDITS_PER_IMAGE
        self.credits_info.configure(
            text=f"Credits needed: {credits_needed} ({len(prompts)} images × {CREDITS_PER_IMAGE} credits)"
        )

        if not prompts:
            empty_label = ctk.CTkLabel(
                self.prompts_list,
                text="No prompts added. Add some prompts above!",
                font=FONTS["body_sm"],
                text_color=self.colors["text_secondary"]
            )
            empty_label.pack(pady=20)
            return

        for i, prompt in enumerate(prompts):
            item = ctk.CTkFrame(
                self.prompts_list,
                fg_color=self.colors["bg_secondary"],
                corner_radius=8,
                height=45
            )
            item.pack(fill="x", pady=2)
            item.pack_propagate(False)

            content = ctk.CTkFrame(item, fg_color="transparent")
            content.pack(fill="both", expand=True, padx=10, pady=8)

            num_label = ctk.CTkLabel(
                content,
                text=str(i + 1),
                font=FONTS["body"],
                text_color=self.colors["primary"],
                width=25
            )
            num_label.pack(side="left")

            prompt_text = prompt[:60] + "..." if len(prompt) > 60 else prompt
            text_label = ctk.CTkLabel(
                content,
                text=prompt_text,
                font=FONTS["body_sm"],
                text_color=self.colors["text"],
                anchor="w"
            )
            text_label.pack(side="left", fill="x", expand=True, padx=10)

            remove_btn = ctk.CTkButton(
                content,
                text="×",
                font=FONTS["heading_sm"],
                width=30,
                height=30,
                fg_color="transparent",
                hover_color=self.colors["error"],
                text_color=self.colors["error"],
                command=lambda idx=i: self._remove_prompt(idx)
            )
            remove_btn.pack(side="right")

    def _save_settings(self):
        """Save current settings"""
        # Save Google credentials
        self.config.set("google_email", self.google_email.get())
        self.config.set_secure("google_password", self.google_password.get())

        # Save other settings
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

    def _start_generation(self):
        """Start image generation"""
        prompts = self.config.get_prompts()

        if not prompts:
            self._show_message("Please add at least one prompt!")
            return

        # Check credits
        credits_needed = len(prompts) * CREDITS_PER_IMAGE
        available = self.api.get_user_credits()

        if available < credits_needed:
            self._show_message(f"Not enough credits! Need {credits_needed}, have {available}")
            return

        # Save settings
        self._save_settings()

        # Show progress UI
        self.is_generating = True
        self.stop_requested = False
        self.generate_frame.pack_forget()
        self.progress_frame.pack(fill="x", pady=20)
        self.progress_bar.set(0)
        self.progress_text.configure(text="0%")
        self.log_output.delete("1.0", "end")

        # Start generation in background
        self.generation_thread = threading.Thread(target=self._run_generation, daemon=True)
        self.generation_thread.start()

    def _run_generation(self):
        """Run the generation process (in background thread)"""
        try:
            from automation.google_flow import GoogleFlowAutomation

            prompts = self.config.get_prompts()

            # Get current project name
            project_name = self.project_name_entry.get().strip() or self.current_project_name

            # Create automation instance with new parameters
            automation = GoogleFlowAutomation(
                email=self.google_email.get(),
                password=self.google_password.get(),
                manual_login=self.manual_login_var.get(),
                headless=self.headless_var.get(),
                timeout=int(self.timeout_entry.get()),
                delay=int(self.delay_entry.get()),
                output_dir=self.config.get_images_dir(),
                log_callback=self._log,
                progress_callback=self._update_progress,
                style_tags=self.selected_style_tags,
                aspect_ratio=self.aspect_ratio_var.get(),
                lock_seed=self.lock_seed_var.get(),
                project_name=project_name
            )

            # Run generation
            results = automation.generate_images(prompts, stop_check=lambda: self.stop_requested)

            # Add project info to results
            for result in results:
                result["project_id"] = self.current_project_id
                result["project_name"] = project_name

            # Update UI
            self.after(0, lambda: self._generation_complete(results))

        except ImportError as e:
            self._log(f"Error: Automation module not found - {e}")
            self.after(0, self._generation_failed)
        except Exception as e:
            self._log(f"Error: {e}")
            self.after(0, self._generation_failed)

    def _update_progress(self, current: int, total: int, prompt: str = ""):
        """Update progress (called from background thread)"""
        progress = current / total if total > 0 else 0
        self.after(0, lambda: self._set_progress(progress, current, total, prompt))

    def _set_progress(self, progress: float, current: int, total: int, prompt: str):
        """Set progress UI (called in main thread)"""
        self.progress_bar.set(progress)
        self.progress_text.configure(text=f"{int(progress * 100)}% ({current}/{total})")
        if prompt:
            short_prompt = prompt[:50] + "..." if len(prompt) > 50 else prompt
            self.current_prompt_label.configure(text=f"Current: {short_prompt}")

    def _log(self, message: str):
        """Log a message (thread-safe)"""
        timestamp = datetime.now().strftime("%H:%M:%S")
        self.after(0, lambda: self._append_log(f"[{timestamp}] {message}"))

    def _append_log(self, message: str):
        """Append to log output (called in main thread)"""
        self.log_output.insert("end", message + "\n")
        self.log_output.see("end")

    def _stop_generation(self):
        """Stop the generation process"""
        self.stop_requested = True
        self._log("Stopping generation...")

    def _generation_complete(self, results: list):
        """Handle generation completion"""
        self.is_generating = False

        # Add to history
        for result in results:
            self.config.add_generation(result)

        # Update credits
        credits_used = len(results) * CREDITS_PER_IMAGE
        new_balance = self.api.sync_credits()
        self.on_credits_update(new_balance)

        self._log(f"Complete! Generated {len(results)} images. Credits used: {credits_used}")

        # Show success message
        self.progress_label.configure(text=f"✅ Generated {len(results)} images!")

        # Show results popup
        if results:
            self._show_results_popup(results)

        # Call callback if provided
        if self.on_generation_complete:
            self.on_generation_complete(results)

    def _show_results_popup(self, results: list):
        """Show a popup with the generated images"""
        popup = ctk.CTkToplevel(self)
        popup.title("Generation Complete!")
        popup.geometry("600x500")
        popup.transient(self.winfo_toplevel())
        popup.grab_set()

        # Center the popup
        popup.update_idletasks()
        x = (popup.winfo_screenwidth() - 600) // 2
        y = (popup.winfo_screenheight() - 500) // 2
        popup.geometry(f"+{x}+{y}")

        # Header
        header_frame = ctk.CTkFrame(popup, fg_color=self.colors["primary"], height=60)
        header_frame.pack(fill="x")
        header_frame.pack_propagate(False)

        header_label = ctk.CTkLabel(
            header_frame,
            text=f"🎉 Generated {len(results)} Images!",
            font=FONTS["heading_lg"],
            text_color="#ffffff"
        )
        header_label.pack(expand=True)

        # Project info
        project_name = results[0].get("project_name", "Unknown Project") if results else "Unknown"
        info_frame = ctk.CTkFrame(popup, fg_color=self.colors["card"], height=40)
        info_frame.pack(fill="x", padx=20, pady=10)

        project_label = ctk.CTkLabel(
            info_frame,
            text=f"📁 Project: {project_name}",
            font=FONTS["body"],
            text_color=self.colors["text"]
        )
        project_label.pack(side="left", padx=15, pady=10)

        # Scrollable image grid
        scroll_frame = ctk.CTkScrollableFrame(
            popup,
            fg_color="transparent"
        )
        scroll_frame.pack(fill="both", expand=True, padx=20, pady=10)

        # Display images in grid
        row_frame = None
        for i, result in enumerate(results):
            if i % 2 == 0:
                row_frame = ctk.CTkFrame(scroll_frame, fg_color="transparent")
                row_frame.pack(fill="x", pady=5)

            img_card = ctk.CTkFrame(
                row_frame,
                fg_color=self.colors["card"],
                corner_radius=8
            )
            img_card.pack(side="left", padx=5, fill="x", expand=True)

            # Try to load and display image
            try:
                from PIL import Image
                img_path = result.get("file", "")
                if img_path:
                    img = Image.open(img_path)
                    img.thumbnail((250, 200))
                    ctk_img = ctk.CTkImage(light_image=img, dark_image=img, size=img.size)
                    img_label = ctk.CTkLabel(img_card, image=ctk_img, text="")
                    img_label.pack(padx=10, pady=10)
            except Exception:
                # Show placeholder if image can't be loaded
                placeholder = ctk.CTkLabel(
                    img_card,
                    text="🖼️ Image",
                    font=FONTS["body"],
                    text_color=self.colors["text_secondary"],
                    width=250,
                    height=150
                )
                placeholder.pack(padx=10, pady=10)

            # Prompt text (truncated)
            prompt_text = result.get("prompt", "")[:40] + "..." if len(result.get("prompt", "")) > 40 else result.get("prompt", "")
            prompt_label = ctk.CTkLabel(
                img_card,
                text=prompt_text,
                font=FONTS["caption"],
                text_color=self.colors["text_secondary"],
                wraplength=230
            )
            prompt_label.pack(padx=10, pady=(0, 10))

        # Bottom buttons
        btn_frame = ctk.CTkFrame(popup, fg_color="transparent")
        btn_frame.pack(fill="x", padx=20, pady=15)

        view_gallery_btn = ctk.CTkButton(
            btn_frame,
            text="View in Gallery",
            font=FONTS["body"],
            command=lambda: [popup.destroy(), self._go_to_gallery()],
            **BUTTON_STYLES["primary"]
        )
        view_gallery_btn.pack(side="left", padx=5)

        close_btn = ctk.CTkButton(
            btn_frame,
            text="Close",
            font=FONTS["body"],
            command=popup.destroy,
            **BUTTON_STYLES["secondary"]
        )
        close_btn.pack(side="right", padx=5)

    def _go_to_gallery(self):
        """Navigate to gallery tab - to be connected by main app"""
        pass  # This will be handled by the main app

    def _generation_failed(self):
        """Handle generation failure"""
        self.is_generating = False
        self.progress_label.configure(text="❌ Generation failed")

    def _show_message(self, message: str):
        """Show a message dialog"""
        dialog = ctk.CTkToplevel(self)
        dialog.title("Message")
        dialog.geometry("300x120")
        dialog.transient(self.winfo_toplevel())
        dialog.grab_set()

        label = ctk.CTkLabel(dialog, text=message, font=FONTS["body"])
        label.pack(pady=20)

        ok_btn = ctk.CTkButton(
            dialog,
            text="OK",
            command=dialog.destroy,
            **BUTTON_STYLES["primary"]
        )
        ok_btn.pack()

    def refresh(self):
        """Refresh the tab"""
        self._refresh_prompts_list()

    def cleanup(self):
        """Clean up resources"""
        self.stop_requested = True
