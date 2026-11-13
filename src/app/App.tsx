import React, { useState } from 'react';
import { AppLayout } from '../layouts/AppLayout';
import { DashboardPage } from '../pages/DashboardPage';
import { WritingStudioPage } from '../pages/WritingStudioPage';
import { ManuscriptsPage } from '../pages/ManuscriptsPage';
import { PersonalNotesPage } from '../pages/PersonalNotesPage';
import { ImportCenterPage } from '../pages/ImportCenterPage';
import { SensitiveVaultPage } from '../pages/SensitiveVaultPage';
import { SearchPage } from '../pages/SearchPage';
import { DictionaryPage } from '../pages/DictionaryPage';
import { BackupPage } from '../pages/BackupPage';
import { SettingsPage } from '../pages/SettingsPage';

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [activeManuscriptId, setActiveManuscriptId] = useState<string | undefined>();
  const [activeNoteId, setActiveNoteId] = useState<string | undefined>();

  const handleNavigate = (tab: string, meta?: any) => {
    if (meta?.manuscriptId) {
      setActiveManuscriptId(meta.manuscriptId);
    }
    if (meta?.noteId) {
      setActiveNoteId(meta.noteId);
    }
    setCurrentTab(tab);
  };

  const renderContent = () => {
    switch (currentTab) {
      case 'dashboard':
        return <DashboardPage onNavigate={handleNavigate} />;
      case 'studio':
        return <WritingStudioPage initialManuscriptId={activeManuscriptId} />;
      case 'manuscripts':
        return (
          <ManuscriptsPage
            onOpenStudio={(id) => {
              setActiveManuscriptId(id);
              setCurrentTab('studio');
            }}
          />
        );
      case 'notes':
        return (
          <PersonalNotesPage
            initialNoteId={activeNoteId}
            onOpenVault={() => setCurrentTab('vault')}
          />
        );
      case 'import':
        return <ImportCenterPage />;
      case 'vault':
        return <SensitiveVaultPage />;
      case 'search':
        return <SearchPage onNavigate={handleNavigate} />;
      case 'dictionary':
        return <DictionaryPage />;
      case 'backup':
        return <BackupPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <DashboardPage onNavigate={handleNavigate} />;
    }
  };

  return (
    <AppLayout currentTab={currentTab} onSelectTab={(tab) => handleNavigate(tab)}>
      {renderContent()}
    </AppLayout>
  );
};
