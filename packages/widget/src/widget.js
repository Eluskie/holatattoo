/**
 * Hola Tattoo WhatsApp Widget
 * Lightweight embeddable widget for websites
 */

(function() {
  'use strict';

  const HolaTattooWidget = {
    config: null,

    init: function(config) {
      this.config = {
        whatsappNumber: config.whatsappNumber,
        message: config.message || 'Hola! M\'interessa saber més',
        brandingColor: config.brandingColor || '#FF6B6B',
        position: config.position || 'bottom-right',
        buttonText: config.buttonText || null
      };

      this.injectStyles();
      this.createButton();
      this.attachEventListeners();
    },

    injectStyles: function() {
      const styles = `
        .hola-tattoo-widget {
          position: fixed;
          z-index: 9999;
          ${this.config.position === 'bottom-left' ? 'left: 20px;' : 'right: 20px;'}
          bottom: 20px;
        }

        .hola-tattoo-button {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background-color: ${this.config.brandingColor};
          color: white;
          border: none;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          transition: transform 0.2s, box-shadow 0.2s;
          font-size: 0;
        }

        .hola-tattoo-button:hover {
          transform: scale(1.1);
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.25);
        }

        .hola-tattoo-button:active {
          transform: scale(0.95);
        }

        .hola-tattoo-button svg {
          width: 32px;
          height: 32px;
          fill: white;
        }

        @media (max-width: 768px) {
          .hola-tattoo-widget {
            ${this.config.position === 'bottom-left' ? 'left: 15px;' : 'right: 15px;'}
            bottom: 15px;
          }

          .hola-tattoo-button {
            width: 56px;
            height: 56px;
          }
        }

        /* Animation */
        @keyframes hola-pulse {
          0% {
            box-shadow: 0 0 0 0 rgba(255, 107, 107, 0.7);
          }
          70% {
            box-shadow: 0 0 0 10px rgba(255, 107, 107, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(255, 107, 107, 0);
          }
        }

        .hola-tattoo-button.hola-pulse {
          animation: hola-pulse 2s infinite;
        }
      `;

      const styleSheet = document.createElement('style');
      styleSheet.textContent = styles;
      document.head.appendChild(styleSheet);
    },

    createButton: function() {
      const container = document.createElement('div');
      container.className = 'hola-tattoo-widget';

      const button = document.createElement('button');
      button.className = 'hola-tattoo-button hola-pulse';
      button.setAttribute('aria-label', 'Open WhatsApp chat');
      button.innerHTML = `
        <svg viewBox="0 0 24 24" width="32" height="32" fill="white">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
        </svg>
      `;

      container.appendChild(button);
      document.body.appendChild(container);

      // Stop pulsing after 10 seconds
      setTimeout(() => {
        button.classList.remove('hola-pulse');
      }, 10000);
    },

    attachEventListeners: function() {
      const button = document.querySelector('.hola-tattoo-button');
      button.addEventListener('click', () => {
        this.openWhatsApp();
        this.trackClick();
      });
    },

    openWhatsApp: function() {
      const encodedMessage = encodeURIComponent(this.config.message);
      const whatsappUrl = `https://wa.me/${this.config.whatsappNumber.replace(/[^0-9]/g, '')}?text=${encodedMessage}`;
      window.open(whatsappUrl, '_blank');
    },

    trackClick: function() {
      // Track widget click (optional analytics)
      if (typeof gtag !== 'undefined') {
        gtag('event', 'whatsapp_widget_click', {
          event_category: 'engagement',
          event_label: 'WhatsApp Widget'
        });
      }

      // Could also send to custom analytics endpoint
      if (this.config.analyticsEndpoint) {
        fetch(this.config.analyticsEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: 'widget_click',
            timestamp: new Date().toISOString(),
            url: window.location.href
          })
        }).catch(() => {}); // Silent fail
      }
    }
  };

  // Expose to global scope
  window.HolaTattooWidget = HolaTattooWidget;
})();
