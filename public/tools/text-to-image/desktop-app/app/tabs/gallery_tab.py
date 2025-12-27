"""
Gallery Tab - View generated images
"""

import customtkinter as ctk
import os
import subprocess
import platform
from pathlib import Path
from PIL import Image, ImageTk
from typing import List, Tuple
from app.theme import COLORS, FONTS, BUTTON_STYLES, get_theme_colors


class GalleryTab(ctk.CTkFrame):
    """Image gallery tab"""

    THUMBNAIL_SIZE = (150, 150)
    COLUMNS = 4

    def __init__(self, parent, config_service):
        super().__init__(parent, fg_color="transparent")
        self.config = config_service
        self.colors = get_theme_colors("dark")

        self.images: List[Path] = []
        self.thumbnails: List[ImageTk.PhotoImage] = []

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

        # Image count
        self.count_label = ctk.CTkLabel(
            self,
            text="0 images",
            font=FONTS["body_sm"],
            text_color=self.colors["text_secondary"]
        )
        self.count_label.pack(anchor="w", padx=30, pady=(0, 10))

        # Gallery grid
        self.gallery_frame = ctk.CTkScrollableFrame(
            self,
            fg_color="transparent"
        )
        self.gallery_frame.pack(fill="both", expand=True, padx=30, pady=(0, 20))

        # Empty state
        self.empty_label = ctk.CTkLabel(
            self.gallery_frame,
            text="📷 No images yet\n\nGenerate some images to see them here!",
            font=FONTS["body"],
            text_color=self.colors["text_secondary"],
            justify="center"
        )

        # Load images
        self._load_images()

    def _load_images(self):
        """Load images from output directory"""
        # Clear existing
        for widget in self.gallery_frame.winfo_children():
            widget.destroy()
        self.thumbnails.clear()

        # Get images
        images_dir = self.config.get_images_dir()
        self.images = []

        if images_dir.exists():
            extensions = ["*.png", "*.jpg", "*.jpeg", "*.webp"]
            for ext in extensions:
                self.images.extend(images_dir.glob(ext))

        # Sort by modification time (newest first)
        self.images.sort(key=lambda x: x.stat().st_mtime, reverse=True)

        # Update count
        self.count_label.configure(text=f"{len(self.images)} images")

        if not self.images:
            self.empty_label.pack(pady=50)
            return

        # Create grid
        self._create_grid()

    def _create_grid(self):
        """Create image grid"""
        row_frame = None

        for i, image_path in enumerate(self.images):
            # Create new row every COLUMNS images
            if i % self.COLUMNS == 0:
                row_frame = ctk.CTkFrame(self.gallery_frame, fg_color="transparent")
                row_frame.pack(fill="x", pady=5)

            # Create image card
            card = self._create_image_card(row_frame, image_path)
            card.pack(side="left", padx=5)

    def _create_image_card(self, parent, image_path: Path):
        """Create an image card"""
        card = ctk.CTkFrame(
            parent,
            fg_color=self.colors["card"],
            corner_radius=10,
            width=self.THUMBNAIL_SIZE[0] + 20,
            height=self.THUMBNAIL_SIZE[1] + 50
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

        except Exception as e:
            error_label = ctk.CTkLabel(
                card,
                text="❌",
                font=("Segoe UI Emoji", 40),
            )
            error_label.pack(pady=20)

        # Filename
        name = image_path.name[:15] + "..." if len(image_path.name) > 15 else image_path.name
        name_label = ctk.CTkLabel(
            card,
            text=name,
            font=FONTS["caption"],
            text_color=self.colors["text_secondary"]
        )
        name_label.pack(pady=(0, 10))

        return card

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
