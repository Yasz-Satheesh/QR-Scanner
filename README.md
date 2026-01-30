# QR Code Scanner Web Application

A modern, beautiful web application for scanning QR codes and displaying the data instantly on the same webpage.

## Features ✨

- **Real-time QR Code Scanning** - Uses your device camera to scan QR codes instantly
- **Smart Data Parsing** - Automatically detects and formats:
  - JSON data (displays as structured key-value pairs)
  - URLs (displays with clickable links and parsed components)
  - Plain text (displays as raw data)
- **Scan History** - Keeps track of your last 20 scans with timestamps
- **Copy to Clipboard** - One-click copying of scanned data
- **Responsive Design** - Works beautifully on desktop, tablet, and mobile
- **Premium UI** - Modern gradient design with smooth animations
- **Keyboard Shortcuts** - Quick actions for power users

## How to Use 🚀

### Opening the Application

1. Simply open `index.html` in any modern web browser:
   - Double-click the `index.html` file, OR
   - Right-click → Open with → Your preferred browser, OR
   - Drag and drop the file into your browser window

2. The application will load with a beautiful purple gradient interface

### Scanning QR Codes

1. Click the **"Start Scanner"** button
2. Allow camera access when prompted by your browser
3. Point your camera at a QR code
4. The app will automatically detect and scan the code
5. Scanned data will be displayed instantly on the same page

### Viewing Results

- **Structured Data**: If the QR code contains JSON, it will be displayed as formatted key-value pairs
- **URLs**: Links will be clickable and show domain, path, and query parameters
- **Plain Text**: Raw text data will be displayed as-is

### Additional Features

- **Copy Data**: Click the "Copy Data" button to copy scanned content to clipboard
- **Scan Again**: Click to immediately start scanning another QR code
- **History**: View your recent scans in the history section below
- **Clear History**: Remove all saved scan history

### Keyboard Shortcuts ⌨️

- `S` - Start/Stop scanner
- `Ctrl + C` - Copy current data
- `Escape` - Clear results and return to scanner

## Technical Details 🔧

### Technologies Used

- **HTML5** - Semantic structure
- **CSS3** - Modern styling with gradients, animations, and responsive design
- **JavaScript (ES6+)** - Core functionality
- **jsQR Library** - QR code detection and decoding
- **MediaDevices API** - Camera access

### Browser Compatibility

Works on all modern browsers that support:
- getUserMedia API (camera access)
- Canvas API
- ES6 JavaScript

**Recommended Browsers:**
- Chrome 60+
- Firefox 55+
- Safari 11+
- Edge 79+

### File Structure

```
├── index.html      # Main HTML file
├── styles.css      # All styling and animations
├── script.js       # Application logic and QR scanning
└── README.md       # This file
```

## Privacy & Security 🔒

- **No Data Collection**: All scanning happens locally in your browser
- **No Server Uploads**: Scanned data never leaves your device
- **Local Storage Only**: History is saved only in your browser's local storage
- **Camera Access**: Only used when you explicitly start the scanner

## Testing the Application 🧪

### Test with Sample QR Codes

You can test the application with these types of QR codes:

1. **Plain Text QR Code** - Any text content
2. **URL QR Code** - Website links
3. **JSON QR Code** - Structured data like:
   ```json
   {
     "name": "John Doe",
     "email": "john@example.com",
     "phone": "+1234567890"
   }
   ```

### Generate Test QR Codes

Use any online QR code generator:
- [QR Code Generator](https://www.qr-code-generator.com/)
- [QRCode Monkey](https://www.qrcode-monkey.com/)
- [The QR Code Generator](https://www.the-qrcode-generator.com/)

## Troubleshooting 🔍

### Camera Not Working?

1. **Check Permissions**: Make sure you allowed camera access
2. **HTTPS Required**: Some browsers require HTTPS for camera access (use localhost or a local server)
3. **Camera in Use**: Close other applications using your camera
4. **Browser Support**: Update to the latest browser version

### Running on Local Server (if needed)

If you encounter camera access issues with `file://` protocol:

```bash
# Using Python 3
python -m http.server 8000

# Using Node.js (if you have http-server installed)
npx http-server -p 8000
```

Then open: `http://localhost:8000`

## Design Highlights 🎨

- **Modern Gradient Background** - Purple to violet gradient
- **Glassmorphism Effects** - Frosted glass-like cards
- **Smooth Animations** - Fade-ins, slides, and hover effects
- **Scan Animation** - Animated scanning line for visual feedback
- **Responsive Layout** - Adapts to all screen sizes
- **Premium Typography** - Inter font family for clean readability

## Future Enhancements 💡

Potential features for future versions:
- Generate QR codes from text
- Export scan history as CSV
- Dark/Light theme toggle
- Multiple language support
- Batch scanning mode
- QR code validation

## License

Free to use and modify for personal and commercial projects.

---

**Enjoy scanning!** 📱✨
