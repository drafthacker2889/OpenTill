import React from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import { X, Check, Monitor, Sun, Moon } from 'lucide-react';

interface SettingsModalProps {
  onClose: () => void;
}

export default function SettingsModal({ onClose }: SettingsModalProps) {
  const { t, i18n } = useTranslation();
  const { theme, setTheme } = useTheme();

  const languages = [
    { code: 'en', label: 'English', flag: '🇬🇧' },
    { code: 'es', label: 'Español', flag: '🇪🇸' },
    { code: 'fr', label: 'Français', flag: '🇫🇷' },
    { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
  ];

  const themes = [
    { id: 'light', label: t('theme_light'), icon: <Sun size={18} /> },
    { id: 'dark', label: t('theme_dark'), icon: <Moon size={18} /> },
    { id: 'system', label: t('theme_system'), icon: <Monitor size={18} /> },
  ];

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '500px', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
        <div className="modal-header" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '15px', marginBottom: '15px' }}>
          <h2 style={{ margin: 0 }}>{t('settings')}</h2>
          <button onClick={onClose} className="close-button" style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', cursor: 'pointer' }}>
            <X size={24} />
          </button>
        </div>
        
        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
          
          {/* Language Section */}
          <div className="setting-section">
            <h3 style={{ marginBottom: '12px', fontSize: '1.1rem' }}>{t('pref_language')}</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => i18n.changeLanguage(lang.code)}
                  style={{
                    padding: '12px',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    background: i18n.language === lang.code ? 'var(--accent-color)' : 'var(--bg-secondary)',
                    color: i18n.language === lang.code ? '#fff' : 'var(--text-primary)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    fontWeight: i18n.language === lang.code ? 'bold' : 'normal'
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>{lang.flag}</span> {lang.label}
                  </span>
                  {i18n.language === lang.code && <Check size={16} />}
                </button>
              ))}
            </div>
          </div>

          {/* Theme Section */}
          <div className="setting-section">
            <h3 style={{ marginBottom: '12px', fontSize: '1.1rem' }}>{t('pref_theme')}</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
              {themes.map((thm) => (
                <button
                  key={thm.id}
                  onClick={() => setTheme(thm.id as any)}
                  style={{
                    padding: '15px',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    background: theme === thm.id ? 'var(--accent-color)' : 'var(--bg-secondary)',
                    color: theme === thm.id ? '#fff' : 'var(--text-primary)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  {thm.icon}
                  <span style={{ fontSize: '0.9em' }}>{thm.label}</span>
                </button>
              ))}
            </div>
          </div>

        </div>

        <div className="modal-footer" style={{ marginTop: '25px', paddingTop: '15px', borderTop: '1px solid var(--border-color)' }}>
          <button 
            onClick={onClose} 
            style={{ 
              width: '100%', 
              padding: '12px', 
              background: 'var(--bg-secondary)', 
              color: 'var(--text-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            {t('close')}
          </button>
        </div>
      </div>
    </div>
  );
}
