"""
Gallery Tab - View generated images organized by projects
"""

import customtkinter as ctk
import os
import subprocess
import platform
import json
from pathlib import Path
from PIL import Image, ImageTk
from typing import List, Dict, Any
from datetime import datetime
from app.theme import COLORS, FONTS, BUTTON_STYLES, get_theme_colors


class GalleryTab(ctk.CTkFrame):
    """Image gallery tab organized by projects"""

    THUMBNAIL_SIZE = (150, 150)
    COLUMNS = 4

    def __init__(self, parent, config_service):
        super().__init__(parent, fg_color="transparent")
        self.config = config_service
        self.colors = get_theme_colors("dark")

        self.images: List[Path] = []
        self.thumbnails: List[ImageTk.PhotoImage] = []
        self.projects: Dict[str, List[Dict[str, Any]]] = {}
        self.current_filter = "all"  # "all" or project_name

        self._create_widgets()

    def _create_widgets(self):
        """Create gallery tab widgets"""
        # Header
        header = ctk.CTkFrame(self, fg_color="transparent")
        header.pack(fill="x", padx=30, pady=(20, 15))

        title = ctk.CTkLabel(
            header,
            text="Gallery",
            font=FONTS["heading_lg"],
            text_color=self.colors["text"]
        )
        title.pack(side="left")

        # Actions
        actions = ctk.CTkFrame(header, fg_color="transparent")
        actions.pack(side="right")

        refresh_btn = ctk.CTkButton(
            actions,
            text="↻ Refresh",
            font=FONTS["body_sm"],
            width=100,
            command=self.refresh,
            **BUTTON_STYLES["secondary"]
        )
        refresh_btn.pack(side="left", padx=(0, 10))

        folder_btn = ctk.CTkButton(
            actions,
            text="📁 Open Folder",
            font=FONTS["body_sm"],
            width=120,
            command=self._open_folder,
            **BUTTON_STYLES["secondary"]
        )
        folder_btn.pack(side="left")

        # Filter section
        filter_frame = ctk.CTkFrame(self, fg_color="transparent")
        filter_frame.pack(fill="x", padx=30, pady=(0, 10))

        filter_label = ctk.CTkLabel(
            filter_frame,
            text="Filter by Project:",
            font=FONTS["body_sm"],
            text_color=self.colors["text_secondary"]
        )
        filter_label.pack(side="left")

        self.filter_var = ctk.StringVar(value="All Projects")
        self.filter_dropdown = ctk.CTkOptionMenu(
            filter_frame,
            values=["All Projects"],
            variable=self.filter_var,
            font=FONTS["body_sm"],
            width=200,
            height=30,
            corner_radius=6,
            fg_color=self.colors["input_bg"],
            button_color=self.colors["primary"],
            button_hover_color=self.colors["primary_hover"],
            dropdown_fg_color=self.colors["card"],
            dropdown_hover_color=self.colors["primary"],
            command=self._on_filter_change
        )
        self.filter_dropdown.pack(side="left", padx=10)

        # Image count
        self.count_label = ctk.CTkLabel(
            filter_frame,
            text="0 images",
            font=FONTS["body_sm"],
            text_color=self.colors["text_secondary"]
        )
        self.count_label.pack(side="right")

        # Gallery content area
        self.gallery_frame = ctk.CTkScrollableFrame(
            self,
            fg_color="transparent"
        )
        self.gallery_frame.pack(fill="both", expand=True, padx=30, pady=(0, 20))

        # Load images
        self._load_images()

    def _load_images(self):
        """Load images from output directory and organize by projects"""
        # Clear existing
        for widget in self.gallery_frame.winfo_children():
            widget.destroy()
        self.thumbnails.clear()
        self.projects.clear()

        # Get images
        images_dir = self.config.get_images_dir()
        self.images = []

        if images_dir.exists():
            extensions = ["*.png", "*.jpg", "*.jpeg", "*.webp"]
            for ext in extensions:
                self.images.extend(images_dir.glob(ext))

        # Sort by modification time (newest first)
        self.images.sort(key=lambda x: x.stat().st_mtime, reverse=True)

        # Load generation history to get project info
        generations = self.config.get_generations()

        # Create a mapping of file paths to generation data
        file_to_gen = {}
        for gen in generations:
            file_path = gen.get("file", "")
            if file_path:
                file_to_gen[Path(file_path).name] = gen

        # Organize images by projects
        for image_path in self.images:
            gen_data = file_to_gen.get(image_path.name, {})
            project_name = gen_data.get("project_name", "Uncategorized")
            project_id = gen_data.get("project_id", "uncategorized")

            if project_name not in self.projects:
                self.projects[project_name] = []

            self.projects[project_name].append({
                "path": image_path,
                "prompt": gen_data.get("prompt", ""),
                "timestamp": gen_data.get("timestamp", ""),
                "aspect_ratio": gen_data.get("aspect_ratio", ""),
                "style_tags": gen_data.get("style_tags", []),
                "project_id": project_id
            })

        # Update filter dropdown
        project_names = ["All Projects"] + list(self.projects.keys())
        self.filter_dropdown.configure(values=project_names)

        # Update count
        self.count_label.configure(text=f"{len(self.images)} images in {len(self.projects)} projects")

        if not self.images:
            self._show_empty_state()
            return

        # Display based on current filter
        self._display_gallery()

    def _show_empty_state(self):
        """Show empty state message"""
        empty_label = ctk.CTkLabel(
            self.gallery_frame,
            text="📷 No images yet\n\nGenerate some images to see them here!",
            font=FONTS["body"],
            text_color=self.colors["text_secondary"],
            justify="center"
        )
        empty_label.pack(pady=50)

    def _display_gallery(self):
        """Display gallery based on current filter"""
        # Clear existing
        for widget in self.gallery_frame.winfo_children():
            widget.destroy()
        self.thumbnails.clear()

        filter_value = self.filter_var.get()

        if filter_value == "All Projects":
            # Show all projects with sections
            for project_name, images in self.projects.items():
                self._create_project_section(project_name, images)
        else:
            # Show single project
            if filter_value in self.projects:
                self._create_project_section(filter_value, self.projects[filter_value])
            else:
                self._show_empty_state()

    def _create_project_section(self, project_name: str, images: List[Dict[str, Any]]):
        """Create a section for a project"""
        # Project header
        section_frame = ctk.CTkFrame(
            self.gallery_frame,
            fg_color=self.colors["card"],
            corner_radius=12
        )
        section_frame.pack(fill="x", pady=(0, 20))

        # Header row
        header_frame = ctk.CTkFrame(section_frame, fg_color="transparent")
        header_frame.pack(fill="x", padx=15, pady=10)

        project_label = ctk.CTkLabel(
            header_frame,
            text=f"📁 {project_name}",
            font=FONTS["heading_sm"],
            text_color=self.colors["text"]
        )
        project_label.pack(side="left")

        count_label = ctk.CTkLabel(
            header_frame,
            text=f"{len(images)} images",
            font=FONTS["body_sm"],
            text_color=self.colors["text_secondary"]
        )
        count_label.pack(side="right")

        # Images grid
        grid_frame = ctk.CTkFrame(section_frame, fg_color="transparent")
        grid_frame.pack(fill="x", padx=10, pady=(0, 10))

        row_frame = None
        for i, img_data in enumerate(images):
            if i % self.COLUMNS == 0:
                row_frame = ctk.CTkFrame(grid_frame, fg_color="transparent")
                row_frame.pack(fill="x", pady=5)

            card = self._create_image_card(row_frame, img_data)
            card.pack(side="left", padx=5)

    def _create_image_card(self, parent, img_data: Dict[str, Any]):
        """Create an image card"""
        image_path = img_data["path"]

        card = ctk.CTkFrame(
            parent,
            fg_color=self.colors["bg_secondary"],
            corner_radius=10,
            width=self.THUMBNAIL_SIZE[0] + 20,
            height=self.THUMBNAIL_SIZE[1] + 70
        )
        card.pack_propagate(False)

        # Load and resize image
        try:
            img = Image.open(image_path)
            img.thumbnail(self.THUMBNAIL_SIZE, Image.Resampling.LANCZOS)

            # Center crop to square
            width, height = img.size
            if width != height:
                min_dim = min(width, height)
                left = (width - min_dim) // 2
                top = (height - min_dim) // 2
                img = img.crop((left, top, left + min_dim, top + min_dim))

            photo = ImageTk.PhotoImage(img)
            self.thumbnails.append(photo)  # Keep reference

            img_label = ctk.CTkLabel(
                card,
                image=photo,
                text=""
            )
            img_label.pack(pady=(10, 5))

            # Bind click to open image
            img_label.bind("<Button-1>", lambda e, p=image_path: self._open_image(p))
            img_label.configure(cursor="hand2")

        except Exception:
            error_label = ctk.CTkLabel(
                card,
                text="❌",
                font=("Segoe UI Emoji", 40),
            )
            error_label.pack(pady=20)

        # Prompt text (truncated)
        prompt = img_data.get("prompt", "")
        prompt_text = prompt[:20] + "..." if len(prompt) > 20 else prompt if prompt else image_path.name[:15]
        prompt_label = ctk.CTkLabel(
            card,
            text=prompt_text,
            font=FONTS["caption"],
            text_color=self.colors["text_secondary"],
            wraplength=self.THUMBNAIL_SIZE[0]
        )
        prompt_label.pack(pady=(0, 5))

        # Style tags indicator
        style_tags = img_data.get("style_tags", [])
        if style_tags:
            tags_text = ", ".join(style_tags[:2])
            if len(style_tags) > 2:
                tags_text += f" +{len(style_tags) - 2}"
            tags_label = ctk.CTkLabel(
                card,
                text=f"🎨 {tags_text}",
                font=FONTS["caption"],
                text_color=self.colors["primary"]
            )
            tags_label.pack(pady=(0, 5))

        return card

    def _on_filter_change(self, value: str):
        """Handle filter dropdown change"""
        self._display_gallery()

    def _open_image(self, image_path: Path):
        """Open image in default viewer"""
        if platform.system() == "Windows":
            os.startfile(str(image_path))
        elif platform.system() == "Darwin":  # macOS
            subprocess.run(["open", str(image_path)])
        else:  # Linux
            subprocess.run(["xdg-open", str(image_path)])

    def _open_folder(self):
        """Open the images folder"""
        images_dir = self.config.get_images_dir()

        if platform.system() == "Windows":
            os.startfile(str(images_dir))
        elif platform.system() == "Darwin":
            subprocess.run(["open", str(images_dir)])
        else:
            subprocess.run(["xdg-open", str(images_dir)])

    def refresh(self):
        """Refresh the gallery"""
        self._load_images()

    def filter_by_project(self, project_name: str):
        """Filter gallery by project name"""
        if project_name in self.projects:
            self.filter_var.set(project_name)
            self._display_gallery()
