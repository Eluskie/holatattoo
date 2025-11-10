# Hola Tattoo Widget

Lightweight embeddable WhatsApp widget for websites.

## Features

- Lightweight (~5KB gzipped)
- No dependencies
- Fully customizable
- Mobile responsive
- Smooth animations
- Click tracking support

## Installation

Add this code to your website, just before the closing `</body>` tag:

```html
<script>
  (function() {
    const config = {
      whatsappNumber: 'whatsapp:+1234567890',
      message: 'Hola! M\'interessa saber més',
      brandingColor: '#FF6B6B',
      position: 'bottom-right'
    };

    const script = document.createElement('script');
    script.src = 'https://your-domain.com/widget.js';
    script.async = true;
    script.onload = function() {
      if (window.HolaTattooWidget) {
        window.HolaTattooWidget.init(config);
      }
    };
    document.head.appendChild(script);
  })();
</script>
```

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `whatsappNumber` | string | required | WhatsApp number with country code |
| `message` | string | 'Hola! M\'interessa saber més' | Pre-filled message |
| `brandingColor` | string | '#FF6B6B' | Button background color |
| `position` | string | 'bottom-right' | 'bottom-right' or 'bottom-left' |
| `analyticsEndpoint` | string | null | Optional endpoint for click tracking |

## Development

Build the widget:
```bash
npm run build
```

Watch for changes:
```bash
npm run dev
```

## License

MIT
