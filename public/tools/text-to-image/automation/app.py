#!/usr/bin/env python3
"""
Text-to-Image Desktop Application
Google Flow (ImageFX) Browser Automation with GUI

This app provides a simple GUI for:
1. Google login (manual or auto)
2. Adding image prompts
3. Running browser automation
4. Displaying generated images
"""

import os
import sys
import json
import time
import base64
import threading
import tkinter as tk
from tkinter import ttk, messagebox, scrolledtext
from datetime import datetime
from pathlib import Path

# Try to import required packages
try:
    import undetected_chromedriver as uc
    from selenium.webdriver.common.by import By
    from selenium.webdriver.common.keys import Keys
    from selenium.webdriver.support.ui import WebDriverWait
    from selenium.webdriver.support import expected_conditions as EC
    from selenium.common.exceptions import TimeoutException
    from PIL import Image, ImageTk
    import requests
except ImportError as e:
    root = tk.Tk()
    root.withdraw()
    messagebox.showerror("Missing Dependencies",
        f"Required packages not installed.\n\n"
        f"Please run: pip install -r requirements.txt\n\n"
        f"Error: {str(e)}")
    sys.exit(1)

# Paths
APP_DIR = Path(__file__).parent if '__file__' in dir() else Path.cwd()
OUTPUT_DIR = APP_DIR / "output"
IMAGES_DIR = OUTPUT_DIR / "images"
CONFIG_FILE = APP_DIR / "config.json"

# URLs
GOOGLE_LOGIN_URL = "https://accounts.google.com/signin"
IMAGEFX_URL = "https://labs.google/fx/tools/image-fx"


class TextToImageApp:
    def __init__(self, root):
        self.root = root
        self.root.title("Text-to-Image Generator - Google Flow")
        self.root.geometry("900x700")
        self.root.minsize(800, 600)

        # Variables
        self.prompts = []
        self.driver = None
        self.is_running = False
        self.generated_images = []

        # Setup directories
        IMAGES_DIR.mkdir(parents=True, exist_ok=True)

        # Create UI
        self.create_ui()

        # Load saved config
        self.load_config()

    def create_ui(self):
        """Create the main UI"""
        # Main container
        main_frame = ttk.Frame(self.root, padding="10")
        main_frame.pack(fill=tk.BOTH, expand=True)

        # Title
        title_label = ttk.Label(main_frame, text="🎨 Text-to-Image Generator",
                               font=("Segoe UI", 18, "bold"))
        title_label.pack(pady=(0, 10))

        subtitle_label = ttk.Label(main_frame, text="Google Flow (ImageFX) Browser Automation",
                                  font=("Segoe UI", 10))
        subtitle_label.pack(pady=(0, 20))

        # Create notebook (tabs)
        self.notebook = ttk.Notebook(main_frame)
        self.notebook.pack(fill=tk.BOTH, expand=True)

        # Tab 1: Configuration
        self.config_frame = ttk.Frame(self.notebook, padding="10")
        self.notebook.add(self.config_frame, text="⚙️ Configuration")

        # Tab 2: Generation
        self.generate_frame = ttk.Frame(self.notebook, padding="10")
        self.notebook.add(self.generate_frame, text="🚀 Generate")

        # Tab 3: Gallery
        self.gallery_frame = ttk.Frame(self.notebook, padding="10")
        self.notebook.add(self.gallery_frame, text="🖼️ Gallery")

        # Build each tab
        self.build_config_tab()
        self.build_generate_tab()
        self.build_gallery_tab()

    def build_config_tab(self):
        """Build the configuration tab"""
        # Login Section
        login_frame = ttk.LabelFrame(self.config_frame, text="Google Login", padding="10")
        login_frame.pack(fill=tk.X, pady=(0, 10))

        # Email
        ttk.Label(login_frame, text="Email:").grid(row=0, column=0, sticky=tk.W, pady=5)
        self.email_var = tk.StringVar()
        self.email_entry = ttk.Entry(login_frame, textvariable=self.email_var, width=40)
        self.email_entry.grid(row=0, column=1, padx=5, pady=5)

        # Password
        ttk.Label(login_frame, text="Password:").grid(row=1, column=0, sticky=tk.W, pady=5)
        self.password_var = tk.StringVar()
        self.password_entry = ttk.Entry(login_frame, textvariable=self.password_var, width=40, show="*")
        self.password_entry.grid(row=1, column=1, padx=5, pady=5)

        # Manual login checkbox
        self.manual_login_var = tk.BooleanVar()
        self.manual_login_check = ttk.Checkbutton(login_frame, text="Use manual login (login in browser yourself)",
                                                   variable=self.manual_login_var)
        self.manual_login_check.grid(row=2, column=0, columnspan=2, sticky=tk.W, pady=5)

        # Prompts Section
        prompts_frame = ttk.LabelFrame(self.config_frame, text="Image Prompts", padding="10")
        prompts_frame.pack(fill=tk.BOTH, expand=True, pady=(0, 10))

        # Add prompt entry
        add_frame = ttk.Frame(prompts_frame)
        add_frame.pack(fill=tk.X, pady=(0, 10))

        self.prompt_entry = ttk.Entry(add_frame, width=60)
        self.prompt_entry.pack(side=tk.LEFT, fill=tk.X, expand=True, padx=(0, 5))
        self.prompt_entry.bind("<Return>", lambda e: self.add_prompt())

        ttk.Button(add_frame, text="Add", command=self.add_prompt).pack(side=tk.LEFT)

        # Prompts listbox
        list_frame = ttk.Frame(prompts_frame)
        list_frame.pack(fill=tk.BOTH, expand=True)

        self.prompts_listbox = tk.Listbox(list_frame, height=8, font=("Segoe UI", 10))
        self.prompts_listbox.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)

        scrollbar = ttk.Scrollbar(list_frame, orient=tk.VERTICAL, command=self.prompts_listbox.yview)
        scrollbar.pack(side=tk.RIGHT, fill=tk.Y)
        self.prompts_listbox.config(yscrollcommand=scrollbar.set)

        # Prompts buttons
        btn_frame = ttk.Frame(prompts_frame)
        btn_frame.pack(fill=tk.X, pady=(10, 0))

        ttk.Button(btn_frame, text="Remove Selected", command=self.remove_prompt).pack(side=tk.LEFT, padx=2)
        ttk.Button(btn_frame, text="Clear All", command=self.clear_prompts).pack(side=tk.LEFT, padx=2)
        ttk.Button(btn_frame, text="Add Samples", command=self.add_samples).pack(side=tk.LEFT, padx=2)

        # Settings Section
        settings_frame = ttk.LabelFrame(self.config_frame, text="Settings", padding="10")
        settings_frame.pack(fill=tk.X, pady=(0, 10))

        # Headless mode
        self.headless_var = tk.BooleanVar()
        ttk.Checkbutton(settings_frame, text="Run headless (hidden browser)",
                       variable=self.headless_var).pack(anchor=tk.W)

        # Timeout
        timeout_frame = ttk.Frame(settings_frame)
        timeout_frame.pack(fill=tk.X, pady=5)
        ttk.Label(timeout_frame, text="Timeout (seconds):").pack(side=tk.LEFT)
        self.timeout_var = tk.IntVar(value=120)
        ttk.Spinbox(timeout_frame, from_=30, to=300, textvariable=self.timeout_var, width=10).pack(side=tk.LEFT, padx=5)

        # Delay
        delay_frame = ttk.Frame(settings_frame)
        delay_frame.pack(fill=tk.X, pady=5)
        ttk.Label(delay_frame, text="Delay between prompts (seconds):").pack(side=tk.LEFT)
        self.delay_var = tk.IntVar(value=5)
        ttk.Spinbox(delay_frame, from_=1, to=30, textvariable=self.delay_var, width=10).pack(side=tk.LEFT, padx=5)

        # Save button
        ttk.Button(self.config_frame, text="💾 Save Configuration",
                  command=self.save_config).pack(pady=10)

    def build_generate_tab(self):
        """Build the generation tab"""
        # Status section
        status_frame = ttk.LabelFrame(self.generate_frame, text="Status", padding="10")
        status_frame.pack(fill=tk.X, pady=(0, 10))

        self.status_label = ttk.Label(status_frame, text="Ready to generate", font=("Segoe UI", 12))
        self.status_label.pack()

        # Progress bar
        self.progress_var = tk.DoubleVar()
        self.progress_bar = ttk.Progressbar(status_frame, variable=self.progress_var, maximum=100)
        self.progress_bar.pack(fill=tk.X, pady=10)

        # Generate button
        self.generate_btn = ttk.Button(self.generate_frame, text="🚀 Start Generation",
                                       command=self.start_generation, style="Accent.TButton")
        self.generate_btn.pack(pady=10)

        # Stop button
        self.stop_btn = ttk.Button(self.generate_frame, text="⏹️ Stop",
                                   command=self.stop_generation, state=tk.DISABLED)
        self.stop_btn.pack(pady=5)

        # Log section
        log_frame = ttk.LabelFrame(self.generate_frame, text="Log", padding="10")
        log_frame.pack(fill=tk.BOTH, expand=True, pady=(10, 0))

        self.log_text = scrolledtext.ScrolledText(log_frame, height=15, font=("Consolas", 9))
        self.log_text.pack(fill=tk.BOTH, expand=True)

    def build_gallery_tab(self):
        """Build the gallery tab"""
        # Toolbar
        toolbar = ttk.Frame(self.gallery_frame)
        toolbar.pack(fill=tk.X, pady=(0, 10))

        ttk.Button(toolbar, text="🔄 Refresh", command=self.refresh_gallery).pack(side=tk.LEFT, padx=2)
        ttk.Button(toolbar, text="📁 Open Folder", command=self.open_output_folder).pack(side=tk.LEFT, padx=2)

        # Gallery canvas with scrollbar
        canvas_frame = ttk.Frame(self.gallery_frame)
        canvas_frame.pack(fill=tk.BOTH, expand=True)

        self.gallery_canvas = tk.Canvas(canvas_frame)
        self.gallery_scrollbar = ttk.Scrollbar(canvas_frame, orient=tk.VERTICAL, command=self.gallery_canvas.yview)

        self.gallery_inner = ttk.Frame(self.gallery_canvas)

        self.gallery_canvas.configure(yscrollcommand=self.gallery_scrollbar.set)

        self.gallery_scrollbar.pack(side=tk.RIGHT, fill=tk.Y)
        self.gallery_canvas.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)

        self.gallery_window = self.gallery_canvas.create_window((0, 0), window=self.gallery_inner, anchor=tk.NW)

        self.gallery_inner.bind("<Configure>", lambda e: self.gallery_canvas.configure(scrollregion=self.gallery_canvas.bbox("all")))
        self.gallery_canvas.bind("<Configure>", lambda e: self.gallery_canvas.itemconfig(self.gallery_window, width=e.width))

        # Initial refresh
        self.refresh_gallery()

    def add_prompt(self):
        """Add a prompt to the list"""
        prompt = self.prompt_entry.get().strip()
        if prompt:
            self.prompts.append(prompt)
            self.prompts_listbox.insert(tk.END, f"{len(self.prompts)}. {prompt}")
            self.prompt_entry.delete(0, tk.END)

    def remove_prompt(self):
        """Remove selected prompt"""
        selection = self.prompts_listbox.curselection()
        if selection:
            index = selection[0]
            self.prompts.pop(index)
            self.refresh_prompts_list()

    def clear_prompts(self):
        """Clear all prompts"""
        self.prompts = []
        self.prompts_listbox.delete(0, tk.END)

    def add_samples(self):
        """Add sample prompts"""
        samples = [
            "A magical forest with glowing mushrooms, fantasy art, 8k ultra detailed",
            "A golden dragon in a crystal cave, cinematic lighting, epic fantasy",
            "A futuristic city at sunset, cyberpunk style, neon lights"
        ]
        for sample in samples:
            self.prompts.append(sample)
        self.refresh_prompts_list()

    def refresh_prompts_list(self):
        """Refresh the prompts listbox"""
        self.prompts_listbox.delete(0, tk.END)
        for i, prompt in enumerate(self.prompts, 1):
            self.prompts_listbox.insert(tk.END, f"{i}. {prompt}")

    def save_config(self):
        """Save configuration to file"""
        config = {
            "google_email": self.email_var.get(),
            "google_password": self.password_var.get(),
            "prompts": self.prompts,
            "settings": {
                "login_method": "manual" if self.manual_login_var.get() else "auto",
                "headless": self.headless_var.get(),
                "timeout": self.timeout_var.get(),
                "delay_between_prompts": self.delay_var.get()
            }
        }

        with open(CONFIG_FILE, 'w', encoding='utf-8') as f:
            json.dump(config, f, indent=2)

        messagebox.showinfo("Saved", "Configuration saved successfully!")

    def load_config(self):
        """Load configuration from file"""
        if CONFIG_FILE.exists():
            try:
                with open(CONFIG_FILE, 'r', encoding='utf-8') as f:
                    config = json.load(f)

                self.email_var.set(config.get("google_email", ""))
                self.password_var.set(config.get("google_password", ""))
                self.prompts = config.get("prompts", [])

                settings = config.get("settings", {})
                self.manual_login_var.set(settings.get("login_method") == "manual")
                self.headless_var.set(settings.get("headless", False))
                self.timeout_var.set(settings.get("timeout", 120))
                self.delay_var.set(settings.get("delay_between_prompts", 5))

                self.refresh_prompts_list()
            except Exception as e:
                self.log(f"Error loading config: {e}")

    def log(self, message):
        """Add message to log"""
        timestamp = datetime.now().strftime("%H:%M:%S")
        self.log_text.insert(tk.END, f"[{timestamp}] {message}\n")
        self.log_text.see(tk.END)
        self.root.update()

    def update_status(self, status):
        """Update status label"""
        self.status_label.config(text=status)
        self.root.update()

    def start_generation(self):
        """Start the generation process"""
        if not self.prompts:
            messagebox.showwarning("No Prompts", "Please add at least one prompt!")
            return

        # Save config first
        self.save_config()

        # Start in separate thread
        self.is_running = True
        self.generate_btn.config(state=tk.DISABLED)
        self.stop_btn.config(state=tk.NORMAL)

        thread = threading.Thread(target=self.run_generation)
        thread.daemon = True
        thread.start()

    def stop_generation(self):
        """Stop the generation process"""
        self.is_running = False
        self.update_status("Stopping...")
        self.log("Stop requested by user")

        if self.driver:
            try:
                self.driver.quit()
            except:
                pass
            self.driver = None

    def run_generation(self):
        """Run the actual generation (in separate thread)"""
        try:
            self.log("Starting generation process...")
            self.update_status("Initializing browser...")

            # Create driver
            headless = self.headless_var.get()
            manual_login = self.manual_login_var.get()

            # Manual login cannot be headless
            if manual_login and headless:
                headless = False
                self.log("Note: Switching to visible browser for manual login")

            options = uc.ChromeOptions()
            if headless:
                options.add_argument('--headless=new')
            options.add_argument('--disable-blink-features=AutomationControlled')
            options.add_argument('--window-size=1920,1080')

            self.driver = uc.Chrome(options=options)
            self.driver.implicitly_wait(10)

            # Login
            if not self.login_google():
                self.log("Login failed!")
                self.cleanup()
                return

            # Navigate to ImageFX
            self.log("Navigating to ImageFX...")
            self.update_status("Loading ImageFX...")
            self.driver.get(IMAGEFX_URL)
            time.sleep(5)

            # Process prompts
            total = len(self.prompts)
            for i, prompt in enumerate(self.prompts, 1):
                if not self.is_running:
                    break

                self.update_status(f"Generating {i}/{total}")
                self.progress_var.set((i / total) * 100)
                self.log(f"Processing prompt {i}/{total}: {prompt[:50]}...")

                self.generate_image(prompt, i)

                if i < total and self.is_running:
                    delay = self.delay_var.get()
                    self.log(f"Waiting {delay}s before next prompt...")
                    time.sleep(delay)

            self.log("Generation complete!")
            self.update_status("Complete!")
            self.progress_var.set(100)

            # Refresh gallery
            self.root.after(100, self.refresh_gallery)
            self.root.after(100, lambda: self.notebook.select(2))  # Switch to gallery tab

        except Exception as e:
            self.log(f"Error: {str(e)}")
            self.update_status("Error occurred")
        finally:
            self.cleanup()

    def login_google(self):
        """Login to Google"""
        manual_login = self.manual_login_var.get()
        timeout = self.timeout_var.get()

        self.log("Logging into Google...")
        self.update_status("Logging in...")

        self.driver.get(GOOGLE_LOGIN_URL)
        time.sleep(2)

        if manual_login:
            # Manual login
            self.log("Manual login mode - please login in the browser window")
            self.log(f"Waiting up to {timeout}s for login completion...")

            start_time = time.time()
            while time.time() - start_time < timeout:
                if not self.is_running:
                    return False

                current_url = self.driver.current_url
                if "myaccount.google.com" in current_url:
                    self.log("Login successful!")
                    return True

                if "google.com" in current_url and "signin" not in current_url and "accounts" not in current_url:
                    self.driver.get(IMAGEFX_URL)
                    time.sleep(3)
                    if "signin" not in self.driver.current_url:
                        self.log("Login successful!")
                        return True
                    self.driver.get(GOOGLE_LOGIN_URL)

                time.sleep(2)

            self.log("Login timeout")
            return False
        else:
            # Auto login
            email = self.email_var.get()
            password = self.password_var.get()

            if not email or not password:
                self.log("No credentials provided! Using manual login.")
                return self.login_google_manual()

            try:
                # Enter email
                self.log("Entering email...")
                email_input = WebDriverWait(self.driver, timeout).until(
                    EC.presence_of_element_located((By.CSS_SELECTOR, "input[type='email']"))
                )
                email_input.send_keys(email)
                email_input.send_keys(Keys.RETURN)
                time.sleep(3)

                # Enter password
                self.log("Entering password...")
                password_input = WebDriverWait(self.driver, timeout).until(
                    EC.presence_of_element_located((By.CSS_SELECTOR, "input[type='password']"))
                )
                password_input.send_keys(password)
                password_input.send_keys(Keys.RETURN)
                time.sleep(5)

                # Check for 2FA
                if "challenge" in self.driver.current_url or "signin" in self.driver.current_url:
                    self.log("2FA required - please complete verification in the browser")
                    for _ in range(60):
                        if not self.is_running:
                            return False
                        time.sleep(2)
                        if "signin" not in self.driver.current_url and "challenge" not in self.driver.current_url:
                            break

                self.log("Login successful!")
                return True

            except TimeoutException:
                self.log("Login timeout")
                return False
            except Exception as e:
                self.log(f"Login error: {e}")
                return False

    def login_google_manual(self):
        """Fallback to manual login"""
        self.manual_login_var.set(True)
        return self.login_google()

    def generate_image(self, prompt, index):
        """Generate a single image"""
        try:
            # Find prompt input
            input_elem = None
            for selector in ["textarea", "input[type='text']", "[contenteditable='true']"]:
                try:
                    elems = self.driver.find_elements(By.CSS_SELECTOR, selector)
                    for elem in elems:
                        if elem.is_displayed() and elem.is_enabled():
                            input_elem = elem
                            break
                except:
                    continue
                if input_elem:
                    break

            if not input_elem:
                self.log("Could not find prompt input!")
                return

            # Enter prompt
            input_elem.clear()
            time.sleep(0.5)
            input_elem.send_keys(prompt)
            input_elem.send_keys(Keys.RETURN)
            time.sleep(2)

            # Wait for image
            self.log("Waiting for image generation...")
            timeout = self.timeout_var.get()
            start_time = time.time()

            while time.time() - start_time < timeout:
                if not self.is_running:
                    return

                try:
                    images = self.driver.find_elements(By.CSS_SELECTOR,
                        "img[src*='blob:'], img[src*='data:'], img[src*='generated']")

                    for img in images:
                        src = img.get_attribute('src')
                        if src and ('blob:' in src or 'data:' in src):
                            # Found image - download it
                            self.download_image(img, prompt, index)
                            self.log(f"Image {index} saved!")
                            return
                except:
                    pass

                time.sleep(2)

            self.log(f"Timeout waiting for image {index}")

        except Exception as e:
            self.log(f"Error generating image: {e}")

    def download_image(self, img_element, prompt, index):
        """Download an image"""
        try:
            src = img_element.get_attribute('src')
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            safe_prompt = "".join(c if c.isalnum() or c in (' ', '-', '_') else '_' for c in prompt[:30])
            filename = f"{timestamp}_{safe_prompt}_{index}.png"
            filepath = IMAGES_DIR / filename

            if src.startswith('data:'):
                # Base64 image
                header, data = src.split(',', 1)
                image_data = base64.b64decode(data)
                with open(filepath, 'wb') as f:
                    f.write(image_data)
            elif src.startswith('blob:'):
                # Screenshot the element
                img_element.screenshot(str(filepath))
            else:
                # URL - download
                response = requests.get(src, timeout=30)
                with open(filepath, 'wb') as f:
                    f.write(response.content)

            self.generated_images.append(str(filepath))

        except Exception as e:
            self.log(f"Error downloading image: {e}")

    def cleanup(self):
        """Cleanup after generation"""
        self.is_running = False
        self.generate_btn.config(state=tk.NORMAL)
        self.stop_btn.config(state=tk.DISABLED)

        if self.driver:
            try:
                self.driver.quit()
            except:
                pass
            self.driver = None

    def refresh_gallery(self):
        """Refresh the gallery with images from output folder"""
        # Clear existing
        for widget in self.gallery_inner.winfo_children():
            widget.destroy()

        # Find images
        if not IMAGES_DIR.exists():
            ttk.Label(self.gallery_inner, text="No images yet. Generate some!").pack(pady=50)
            return

        images = list(IMAGES_DIR.glob("*.png")) + list(IMAGES_DIR.glob("*.jpg"))
        images.sort(key=lambda x: x.stat().st_mtime, reverse=True)

        if not images:
            ttk.Label(self.gallery_inner, text="No images yet. Generate some!").pack(pady=50)
            return

        # Display images in grid
        row_frame = None
        for i, img_path in enumerate(images[:20]):  # Show last 20
            if i % 3 == 0:
                row_frame = ttk.Frame(self.gallery_inner)
                row_frame.pack(fill=tk.X, pady=5)

            try:
                # Load and resize image
                img = Image.open(img_path)
                img.thumbnail((200, 200))
                photo = ImageTk.PhotoImage(img)

                # Create frame for image
                img_frame = ttk.Frame(row_frame, padding="5")
                img_frame.pack(side=tk.LEFT, padx=5)

                # Image label
                label = ttk.Label(img_frame, image=photo)
                label.image = photo  # Keep reference
                label.pack()

                # Filename
                ttk.Label(img_frame, text=img_path.name[:20] + "...",
                         font=("Segoe UI", 8)).pack()
            except Exception as e:
                print(f"Error loading image {img_path}: {e}")

    def open_output_folder(self):
        """Open the output folder"""
        os.startfile(str(IMAGES_DIR))


def main():
    root = tk.Tk()

    # Set theme
    style = ttk.Style()
    try:
        style.theme_use('vista')
    except:
        pass

    app = TextToImageApp(root)
    root.mainloop()


if __name__ == "__main__":
    main()
