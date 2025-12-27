"""
Generate Tab - Prompt entry and image generation
"""

import customtkinter as ctk
import threading
from typing import Callable, Optional
from datetime import datetime
from app.theme import COLORS, FONTS, BUTTON_STYLES, INPUT_STYLE, get_theme_colors
from app.constants import CREDITS_PER_IMAGE


class GenerateTab(ctk.CTkFrame):
    """Image generation tab"""

    def __init__(self, parent, api_service, config_service, on_credits_update: Callable):
        super().__init__(parent, fg_color="transparent")
        self.api = api_service
        self.config = config_service
        self.on_credits_update = on_credits_update
        self.colors = get_theme_colors("dark")

        self.is_generating = False
        self.generation_thread: Optional[threading.Thread] = None
        self.stop_requested = False

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
            text="🚀 Start Generation",
            font=FONTS["heading_sm"],
            height=50,
            command=self._start_generation,
            **BUTTON_STYLES["success"]
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

            # Create automation instance
            automation = GoogleFlowAutomation(
                email=self.google_email.get(),
                password=self.google_password.get(),
                manual_login=self.manual_login_var.get(),
                headless=self.headless_var.get(),
                timeout=int(self.timeout_entry.get()),
                delay=int(self.delay_entry.get()),
                output_dir=self.config.get_images_dir(),
                log_callback=self._log,
                progress_callback=self._update_progress
            )

            # Run generation
            results = automation.generate_images(prompts, stop_check=lambda: self.stop_requested)

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
