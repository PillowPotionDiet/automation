"""
CustomTkinter Theme Configuration
"""

# Color Palette
COLORS = {
    "primary": "#6366f1",
    "primary_hover": "#4f46e5",
    "primary_dark": "#4338ca",
    "success": "#10b981",
    "success_hover": "#059669",
    "error": "#ef4444",
    "error_hover": "#dc2626",
    "warning": "#f59e0b",
    "warning_hover": "#d97706",

    # Dark Theme
    "dark": {
        "bg": "#1a1a2e",
        "bg_secondary": "#16213e",
        "card": "#0f3460",
        "card_hover": "#1a4a7a",
        "text": "#ffffff",
        "text_secondary": "#a0aec0",
        "border": "#2d3748",
        "input_bg": "#2d3748",
    },

    # Light Theme
    "light": {
        "bg": "#f7fafc",
        "bg_secondary": "#edf2f7",
        "card": "#ffffff",
        "card_hover": "#f0f0f0",
        "text": "#1a202c",
        "text_secondary": "#718096",
        "border": "#e2e8f0",
        "input_bg": "#ffffff",
    }
}

# Font Configuration
FONTS = {
    "heading_xl": ("Inter", 28, "bold"),
    "heading_lg": ("Inter", 24, "bold"),
    "heading_md": ("Inter", 20, "bold"),
    "heading_sm": ("Inter", 16, "bold"),
    "body_lg": ("Inter", 16),
    "body": ("Inter", 14),
    "body_sm": ("Inter", 12),
    "caption": ("Inter", 11),
    "mono": ("Consolas", 12),
}

# Widget Styling
BUTTON_STYLES = {
    "primary": {
        "fg_color": COLORS["primary"],
        "hover_color": COLORS["primary_hover"],
        "text_color": "#ffffff",
        "corner_radius": 8,
        "height": 40,
    },
    "secondary": {
        "fg_color": "transparent",
        "hover_color": COLORS["dark"]["card_hover"],
        "text_color": COLORS["dark"]["text"],
        "border_width": 1,
        "border_color": COLORS["dark"]["border"],
        "corner_radius": 8,
        "height": 40,
    },
    "success": {
        "fg_color": COLORS["success"],
        "hover_color": COLORS["success_hover"],
        "text_color": "#ffffff",
        "corner_radius": 8,
        "height": 40,
    },
    "danger": {
        "fg_color": COLORS["error"],
        "hover_color": COLORS["error_hover"],
        "text_color": "#ffffff",
        "corner_radius": 8,
        "height": 40,
    },
}

INPUT_STYLE = {
    "corner_radius": 8,
    "border_width": 2,
    "height": 45,
}

CARD_STYLE = {
    "corner_radius": 12,
    "border_width": 0,
}


def get_theme_colors(mode: str = "dark") -> dict:
    """Get color palette for specified mode"""
    base = COLORS[mode] if mode in COLORS else COLORS["dark"]
    return {
        **base,
        "primary": COLORS["primary"],
        "primary_hover": COLORS["primary_hover"],
        "success": COLORS["success"],
        "error": COLORS["error"],
        "warning": COLORS["warning"],
    }
