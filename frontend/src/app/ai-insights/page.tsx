'use client';

export default function AIInsights() {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#0B0E14',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '48px'
    }}>
      <div style={{
        maxWidth: '800px',
        textAlign: 'center'
      }}>
        {/* Graffiti Style "COMING SOON" */}
        <div style={{
          fontSize: '120px',
          fontWeight: '900',
          background: 'linear-gradient(135deg, #FF6B9D 0%, #C084FC 25%, #60A5FA 50%, #34D399 75%, #FBBF24 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          letterSpacing: '-0.05em',
          lineHeight: '1',
          marginBottom: '32px',
          textTransform: 'uppercase',
          fontFamily: 'Impact, "Arial Black", sans-serif',
          transform: 'skew(-5deg)',
          textShadow: '4px 4px 0px rgba(0,0,0,0.2)'
        }}>
          Coming<br/>Soon
        </div>

        {/* AI Icon */}
        <div style={{ marginBottom: '32px' }}>
          <svg 
            width="120" 
            height="120" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="url(#gradient)" 
            strokeWidth="1.5"
            style={{ margin: '0 auto', filter: 'drop-shadow(0 0 20px rgba(167, 139, 250, 0.5))' }}
          >
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#A78BFA" />
                <stop offset="50%" stopColor="#60A5FA" />
                <stop offset="100%" stopColor="#34D399" />
              </linearGradient>
            </defs>
            <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
            <path d="M2 17l10 5 10-5"></path>
            <path d="M2 12l10 5 10-5"></path>
          </svg>
        </div>

        {/* Title */}
        <h1 style={{
          fontSize: '48px',
          fontWeight: '700',
          color: '#E5E7EB',
          marginBottom: '24px',
          letterSpacing: '-0.02em'
        }}>
          AI-Powered Network Insights
        </h1>

        {/* Description */}
        <p style={{
          fontSize: '20px',
          color: '#9CA3AF',
          marginBottom: '48px',
          lineHeight: '1.6',
          maxWidth: '600px',
          margin: '0 auto 48px'
        }}>
          We're building intelligent network analysis powered by LangChain & Google Gemini.
          Get insights on bandwidth consumption, device behavior, and network optimization.
        </p>

        {/* Features List */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '24px',
          marginBottom: '48px',
          textAlign: 'left'
        }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.06)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(167, 139, 250, 0.2)',
            borderRadius: '12px',
            padding: '24px'
          }}>
            <div style={{ 
              fontSize: '32px', 
              marginBottom: '12px',
              filter: 'grayscale(0.3)'
            }}>
              🤖
            </div>
            <h3 style={{ 
              fontSize: '18px', 
              fontWeight: '600', 
              color: '#E5E7EB', 
              marginBottom: '8px' 
            }}>
              Smart Analysis
            </h3>
            <p style={{ fontSize: '14px', color: '#9CA3AF', lineHeight: '1.5' }}>
              AI-driven insights on your network traffic patterns and device behavior
            </p>
          </div>

          <div style={{
            background: 'rgba(255, 255, 255, 0.06)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(96, 165, 250, 0.2)',
            borderRadius: '12px',
            padding: '24px'
          }}>
            <div style={{ 
              fontSize: '32px', 
              marginBottom: '12px',
              filter: 'grayscale(0.3)'
            }}>
              📊
            </div>
            <h3 style={{ 
              fontSize: '18px', 
              fontWeight: '600', 
              color: '#E5E7EB', 
              marginBottom: '8px' 
            }}>
              Consumption Tracking
            </h3>
            <p style={{ fontSize: '14px', color: '#9CA3AF', lineHeight: '1.5' }}>
              Detailed breakdown of bandwidth usage per device with recommendations
            </p>
          </div>

          <div style={{
            background: 'rgba(255, 255, 255, 0.06)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(52, 211, 153, 0.2)',
            borderRadius: '12px',
            padding: '24px'
          }}>
            <div style={{ 
              fontSize: '32px', 
              marginBottom: '12px',
              filter: 'grayscale(0.3)'
            }}>
              ⚡
            </div>
            <h3 style={{ 
              fontSize: '18px', 
              fontWeight: '600', 
              color: '#E5E7EB', 
              marginBottom: '8px' 
            }}>
              Optimization Tips
            </h3>
            <p style={{ fontSize: '14px', color: '#9CA3AF', lineHeight: '1.5' }}>
              Get personalized suggestions to improve your network performance
            </p>
          </div>

          <div style={{
            background: 'rgba(255, 255, 255, 0.06)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(251, 191, 36, 0.2)',
            borderRadius: '12px',
            padding: '24px'
          }}>
            <div style={{ 
              fontSize: '32px', 
              marginBottom: '12px',
              filter: 'grayscale(0.3)'
            }}>
              🔮
            </div>
            <h3 style={{ 
              fontSize: '18px', 
              fontWeight: '600', 
              color: '#E5E7EB', 
              marginBottom: '8px' 
            }}>
              Predictive Alerts
            </h3>
            <p style={{ fontSize: '14px', color: '#9CA3AF', lineHeight: '1.5' }}>
              Proactive notifications about potential network issues before they occur
            </p>
          </div>
        </div>

        {/* Back Button */}
        <a 
          href="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '12px',
            padding: '16px 32px',
            background: 'linear-gradient(135deg, rgba(167, 139, 250, 0.2) 0%, rgba(96, 165, 250, 0.2) 100%)',
            border: '1px solid rgba(167, 139, 250, 0.4)',
            borderRadius: '12px',
            color: '#A78BFA',
            fontSize: '16px',
            fontWeight: '600',
            textDecoration: 'none',
            transition: 'all 0.3s ease',
            cursor: 'pointer'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'linear-gradient(135deg, rgba(167, 139, 250, 0.3) 0%, rgba(96, 165, 250, 0.3) 100%)';
            e.currentTarget.style.borderColor = 'rgba(167, 139, 250, 0.6)';
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'linear-gradient(135deg, rgba(167, 139, 250, 0.2) 0%, rgba(96, 165, 250, 0.2) 100%)';
            e.currentTarget.style.borderColor = 'rgba(167, 139, 250, 0.4)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          Back to Dashboard
        </a>

        {/* Footer Note */}
        <p style={{
          marginTop: '48px',
          fontSize: '14px',
          color: '#6B7280',
          fontFamily: 'Fira Code'
        }}>
          Stay tuned! This feature is under active development 🚀
        </p>
      </div>
    </div>
  );
}
