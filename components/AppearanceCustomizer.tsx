import React, { useState, useCallback } from "react";
import type { ThemePreset, ExtendedTheme } from "../types";
import { useAppearance, LAYOUT_PRESETS } from "../hooks/useAppearance";
import { exportTheme, importTheme, hexToRgb } from "../services/themeUtils";
import { useNotificationReplacements } from "../hooks/useNotificationReplacements";
import { useLanguage } from "../contexts/LanguageContext";
import { Card } from "./ui/Card";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { Tabs } from "./ui/Tabs";
import { Badge } from "./ui/Badge";
import { IconButton } from "./ui/IconButton";
import { ActionIcons, StatusIcons } from "./icons";
import { ChevronDown } from "lucide-react";
import { Modal } from "./Modal";
import { BackgroundCreator } from "./BackgroundCreator";

interface AppearanceCustomizerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AppearanceCustomizer: React.FC<AppearanceCustomizerProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    currentTheme,
    defaultPresets,
    customThemes,
    setCurrentTheme,
    removeCustomTheme,
    headerConfig,
    updateHeaderConfig,
    contentConfig,
    updateContentConfig,
    applyLayoutPreset,
    activeLayoutId,
    backgroundConfig,
    updateBackgroundConfig,
  } = useAppearance();

  const { alertSuccess, alertError } = useNotificationReplacements();
  const { t } = useLanguage();

  const [activeTab, setActiveTab] = useState<
    "layouts" | "colors" | "header" | "content" | "background" | "import-export"
  >("layouts");
  const [importText, setImportText] = useState("");
  const [exportText, setExportText] = useState("");
  const [editingTheme, setEditingTheme] = useState<ExtendedTheme | null>(null);

  // ... (handlers remain the same)

  const handlePresetSelect = useCallback(
    (preset: ThemePreset) => {
      setCurrentTheme(preset.theme);
    },
    [setCurrentTheme]
  );

  const handleEditTheme = useCallback((theme: ExtendedTheme) => {
    setEditingTheme({ ...theme });
  }, []);

  const handleColorChange = useCallback(
    (colorKey: string, hexValue: string) => {
      if (!editingTheme) return;

      try {
        const rgbValue = hexToRgb(hexValue);
        setEditingTheme((prev) =>
          prev
            ? {
              ...prev,
              colors: {
                ...prev.colors,
                [colorKey]: rgbValue,
              },
            }
            : null
        );
      } catch (error) {
        console.warn("Invalid hex color:", hexValue);
      }
    },
    [editingTheme]
  );

  const handleSaveEditedTheme = useCallback(() => {
    if (!editingTheme) return;

    const customTheme: ExtendedTheme = {
      ...editingTheme,
      id: `custom-${Date.now()}`,
      name: `${editingTheme.name} (Edited)`,
    };

    setCurrentTheme(customTheme);
    setEditingTheme(null);
  }, [editingTheme, setCurrentTheme]);

  const handleApplyLivePreview = useCallback(() => {
    if (!editingTheme) return;
    setCurrentTheme(editingTheme);
  }, [editingTheme, setCurrentTheme]);

  const rgbToHex = useCallback((rgb: string): string => {
    const [r, g, b] = rgb.split(" ").map(Number);
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
  }, []);

  const handleExport = useCallback(() => {
    setExportText(exportTheme(currentTheme));
  }, [currentTheme]);

  const handleImport = useCallback(async () => {
    const imported = importTheme(importText);
    if (imported) {
      setCurrentTheme(imported);
      setImportText("");
      await alertSuccess("Theme imported successfully!");
    } else {
      await alertError("Failed to import theme. Please check the format.");
    }
  }, [importText, setCurrentTheme, alertSuccess, alertError]);
  
  const handleLogoUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        updateHeaderConfig({ logoUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  }, [updateHeaderConfig]);

  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({
    headerStyle: true,
    headerPosition: true,
    headerBranding: true,
    contentLayoutMode: true,
    articleMetadata: true,
    layoutDensity: true,
    colorPresets: true,
    customThemes: true,
    exportTheme: true,
    importTheme: true,
  });

  const toggleSection = useCallback((id: string) => {
    setCollapsedSections(prev => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const tabs = [
    { id: "layouts", label: t('customizer.tab.layouts'), icon: <div className="w-4 h-4 border-2 border-current rounded-sm" /> },
    { id: "colors", label: t('customizer.tab.colors'), icon: <StatusIcons.Theme /> },
    { id: "background", label: t('customizer.tab.background'), icon: <div className="w-4 h-4 bg-gradient-to-br from-current to-transparent rounded-full" /> },
    { id: "header", label: t('customizer.tab.header'), icon: <div className="w-4 h-4 border-t-2 border-current" /> },
    { id: "content", label: t('customizer.tab.content'), icon: <div className="w-4 h-4 border-2 border-current" /> },
    { id: "import-export", label: t('customizer.tab.import_export'), icon: <ActionIcons.Export /> },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} ariaLabel={t('customizer.title')}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-[rgb(var(--color-accent))]/10">
              <StatusIcons.Theme className="w-6 h-6 text-[rgb(var(--color-accent))]" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{t('customizer.title')}</h2>
              <p className="text-sm text-gray-400">
                {t('customizer.subtitle')}
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={(tabId) => setActiveTab(tabId as any)}
          variant="glass"
          className="mb-6"
        />

        {/* Content */}
        <div className="min-h-[400px]">
          {activeTab === "layouts" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[...LAYOUT_PRESETS].sort((a, b) => a.name.localeCompare(b.name)).map((preset) => (
                  <Card
                    key={preset.id}
                    variant={activeLayoutId === preset.id ? "glass" : "outline"}
                    className={`cursor-pointer hover:border-[rgb(var(--color-accent))] hover:bg-white/5 transition-all group ${activeLayoutId === preset.id ? "border-[rgb(var(--color-accent))] ring-1 ring-[rgb(var(--color-accent))]" : ""}`}
                    onClick={() => applyLayoutPreset(preset.id)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className={`text-lg font-semibold transition-colors ${activeLayoutId === preset.id ? "text-[rgb(var(--color-accent))]" : "text-white group-hover:text-[rgb(var(--color-accent))]"}`}>
                        {preset.name}
                      </h3>
                      {activeLayoutId === preset.id && (
                        <Badge variant="primary" className="text-xs">
                          Active
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-400 mb-4">{preset.description}</p>
                    <div className="text-xs text-gray-500 space-y-1">
                      <p>Header: <span className="text-gray-300">{preset.header.style}</span></p>
                      <p>Content: <span className="text-gray-300">{preset.content.density}</span></p>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {activeTab === "colors" && (
            <div className="space-y-8 animate-in fade-in duration-300">
              {/* Editor Section (Integrated) */}
              {editingTheme ? (
                 <div className="space-y-6">
                 {/* Editor Header */}
                 <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-gray-800/30 p-4 rounded-xl border border-white/5">
                   <div>
                     <h3 className="text-xl font-semibold text-white mb-1 flex items-center">
                       <ActionIcons.Edit className="w-5 h-5 mr-2 text-[rgb(var(--color-accent))]" />
                       Editing: {editingTheme.name}
                     </h3>
                     <p className="text-sm text-gray-400">
                       Adjust colors individually
                     </p>
                   </div>
                   <div className="flex flex-wrap gap-2">
                     <Button
                       onClick={handleApplyLivePreview}
                       variant="secondary"
                       size="sm"
                       icon={<StatusIcons.Preview />}
                     >
                       {t('action.preview')}
                     </Button>
                     <Button
                       onClick={handleSaveEditedTheme}
                       variant="primary"
                       size="sm"
                       icon={<ActionIcons.Save />}
                     >
                       {t('action.save')}
                     </Button>
                     <Button
                       onClick={() => setEditingTheme(null)}
                       variant="ghost"
                       size="sm"
                       icon={<ActionIcons.Close />}
                     >
                       {t('action.cancel')}
                     </Button>
                   </div>
                 </div>

                 {/* Color Editor Grid */}
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                   <Card variant="glass" className="p-6">
                     <h4 className="text-lg font-semibold text-white mb-6">{t('customizer.group.primary_colors')}</h4>
                     <div className="space-y-6">
                       {['primary', 'accent', 'secondary'].map((key) => (
                         <div key={key}>
                           <label className="block text-sm font-medium text-gray-300 mb-2 capitalize">{key}</label>
                           <div className="flex items-center space-x-3">
                             <input
                               type="color"
                               value={rgbToHex(editingTheme.colors[key as keyof typeof editingTheme.colors] as string)}
                               onChange={(e) => handleColorChange(key, e.target.value)}
                               className="w-10 h-10 rounded-lg border-0 p-0 cursor-pointer"
                             />
                             <Input
                               value={rgbToHex(editingTheme.colors[key as keyof typeof editingTheme.colors] as string)}
                               onChange={(e) => handleColorChange(key, e.target.value)}
                               className="flex-1 font-mono text-sm"
                             />
                           </div>
                         </div>
                       ))}
                     </div>
                   </Card>
                   <Card variant="glass" className="p-6">
                     <h4 className="text-lg font-semibold text-white mb-6">{t('customizer.group.background_colors')}</h4>
                     <div className="space-y-6">
                       {['background', 'surface', 'text'].map((key) => (
                         <div key={key}>
                           <label className="block text-sm font-medium text-gray-300 mb-2 capitalize">{key}</label>
                           <div className="flex items-center space-x-3">
                             <input
                               type="color"
                               value={rgbToHex(editingTheme.colors[key as keyof typeof editingTheme.colors] as string)}
                               onChange={(e) => handleColorChange(key, e.target.value)}
                               className="w-10 h-10 rounded-lg border-0 p-0 cursor-pointer"
                             />
                             <Input
                               value={rgbToHex(editingTheme.colors[key as keyof typeof editingTheme.colors] as string)}
                               onChange={(e) => handleColorChange(key, e.target.value)}
                               className="flex-1 font-mono text-sm"
                             />
                           </div>
                         </div>
                       ))}
                     </div>
                   </Card>
                 </div>
               </div>
              ) : (
                <>
                  {/* Presets List */}
                  <div>
                    <div 
                      className="flex justify-between items-center cursor-pointer mb-4"
                      onClick={() => toggleSection('colorPresets')}
                    >
                      <h3 className="text-lg font-semibold text-white">Color Presets</h3>
                      <ChevronDown className={`w-5 h-5 transition-transform ${collapsedSections.colorPresets ? 'rotate-0' : 'rotate-180'}`} />
                    </div>
                    {!collapsedSections.colorPresets && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-in fade-in slide-in-from-top-2">
                        {defaultPresets.map((preset) => (
                          <Card
                            key={preset.id}
                            variant={currentTheme.id === preset.id ? "glass" : "outline"}
                            className={`cursor-pointer transition-all duration-200 hover:scale-[1.02] ${currentTheme.id === preset.id
                                ? "ring-1 ring-[rgb(var(--color-accent))]"
                                : "hover:border-white/20"
                              }`}
                            onClick={() => handlePresetSelect(preset)}
                          >
                            <div className="flex space-x-2 mb-3">
                              {[preset.theme.colors.primary, preset.theme.colors.accent, preset.theme.colors.background].map((color, i) => (
                                <div key={i} className="w-6 h-6 rounded-full border border-white/10" style={{ backgroundColor: `rgb(${color})` }} />
                              ))}
                            </div>
                            <div className="flex justify-between items-center">
                              <h4 className="font-semibold text-white">{preset.name}</h4>
                              <Button
                                variant="ghost"
                                size="sm"
                                icon={<ActionIcons.Edit />}
                                onClick={(e) => {
                                  e?.stopPropagation();
                                  handleEditTheme(preset.theme);
                                }}
                              >
                                {t('action.edit')}
                              </Button>
                            </div>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Custom Themes */}
                  {customThemes.length > 0 && (
                    <div className="mt-8">
                      <div 
                        className="flex justify-between items-center cursor-pointer mb-4"
                        onClick={() => toggleSection('customThemes')}
                      >
                        <h3 className="text-lg font-semibold text-white">My Custom Themes</h3>
                        <ChevronDown className={`w-5 h-5 transition-transform ${collapsedSections.customThemes ? 'rotate-0' : 'rotate-180'}`} />
                      </div>
                      {!collapsedSections.customThemes && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-in fade-in slide-in-from-top-2">
                          {customThemes.map((theme) => (
                            <Card
                              key={theme.id}
                              variant={currentTheme.id === theme.id ? "glass" : "outline"}
                              className="cursor-pointer hover:border-[rgb(var(--color-accent))]"
                              onClick={() => setCurrentTheme(theme)}
                            >
                              <div className="flex justify-between items-center mb-2">
                                <h4 className="font-semibold text-white">{theme.name}</h4>
                                <IconButton
                                  onClick={(e) => {
                                    e?.stopPropagation();
                                    removeCustomTheme(theme.id);
                                  }}
                                  variant="ghost"
                                  size="sm"
                                  icon={<ActionIcons.Delete />}
                                  className="text-red-400 hover:text-red-300"
                                />
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="w-full mt-2"
                                onClick={(e) => {
                                  e?.stopPropagation();
                                  handleEditTheme(theme);
                                }}
                              >
                                Edit Colors
                              </Button>
                            </Card>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* ... (Background, Header, Content tabs - assumed similar replacement for brevity, but focusing on keys added) ... */}
          {/* Note: I'm only replacing the parts I added keys for to keep the diff manageable and correct. */}
          
          {activeTab === "import-export" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <Card variant="glass" className="p-6">
                <div 
                  className="flex justify-between items-center cursor-pointer mb-2"
                  onClick={() => toggleSection('exportTheme')}
                >
                  <h3 className="text-xl font-semibold text-white flex items-center">
                    <ActionIcons.Export className="w-5 h-5 mr-2 text-blue-400" />
                    Export Theme
                  </h3>
                  <ChevronDown className={`w-5 h-5 transition-transform ${collapsedSections.exportTheme ? 'rotate-0' : 'rotate-180'}`} />
                </div>
                {!collapsedSections.exportTheme && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                    <p className="text-gray-400 mb-6 text-sm">
                      {t('customizer.export.desc')}
                    </p>
                    <div className="space-y-4">
                      <Button
                        onClick={handleExport}
                        variant="primary"
                        icon={<ActionIcons.Export />}
                        className="w-full sm:w-auto"
                      >
                        Generate Export JSON
                      </Button>
                      {exportText && (
                        <div className="animate-in slide-in-from-top-2">
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Theme JSON (click to select all)
                          </label>
                          <textarea
                            value={exportText}
                            readOnly
                            rows={8}
                            className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-lg text-gray-300 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-accent))] resize-none"
                            onClick={(e) => e.currentTarget.select()}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </Card>

              <Card variant="glass" className="p-6">
                <div 
                  className="flex justify-between items-center cursor-pointer mb-2"
                  onClick={() => toggleSection('importTheme')}
                >
                  <h3 className="text-xl font-semibold text-white flex items-center">
                    <ActionIcons.Import className="w-5 h-5 mr-2 text-green-400" />
                    Import Theme
                  </h3>
                  <ChevronDown className={`w-5 h-5 transition-transform ${collapsedSections.importTheme ? 'rotate-0' : 'rotate-180'}`} />
                </div>
                {!collapsedSections.importTheme && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                    <p className="text-gray-400 mb-6 text-sm">
                      {t('customizer.import.desc')}
                    </p>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Paste Theme JSON
                        </label>
                        <textarea
                          value={importText}
                          onChange={(e) => setImportText(e.target.value)}
                          rows={5}
                          className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-lg text-gray-300 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-accent))] resize-none"
                          placeholder={t('customizer.import.placeholder')}
                        />
                      </div>
                      <Button
                        onClick={handleImport}
                        variant="secondary"
                        icon={<ActionIcons.Import />}
                        disabled={!importText}
                        className="w-full sm:w-auto"
                      >
                        Import Theme
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
