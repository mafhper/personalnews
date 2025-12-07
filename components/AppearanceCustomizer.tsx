import React, { useState, useCallback } from "react";
import type { ThemePreset, ExtendedTheme } from "../types";
import { useAppearance, LAYOUT_PRESETS } from "../hooks/useAppearance";
import { exportTheme, importTheme, hexToRgb } from "../services/themeUtils";
import { useNotificationReplacements } from "../hooks/useNotificationReplacements";
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

  const [activeTab, setActiveTab] = useState<
    "layouts" | "colors" | "header" | "content" | "background" | "import-export"
  >("layouts");
  const [importText, setImportText] = useState("");
  const [exportText, setExportText] = useState("");
  const [editingTheme, setEditingTheme] = useState<ExtendedTheme | null>(null);

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
    { id: "layouts", label: "Layouts", icon: <div className="w-4 h-4 border-2 border-current rounded-sm" /> },
    { id: "colors", label: "Colors", icon: <StatusIcons.Theme /> },
    { id: "background", label: "Background", icon: <div className="w-4 h-4 bg-gradient-to-br from-current to-transparent rounded-full" /> },
    { id: "header", label: "Header", icon: <div className="w-4 h-4 border-t-2 border-current" /> },
    { id: "content", label: "Content", icon: <div className="w-4 h-4 border-2 border-current" /> },
    { id: "import-export", label: "Import/Export", icon: <ActionIcons.Export /> },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} ariaLabel="Appearance Customizer">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-[rgb(var(--color-accent))]/10">
              <StatusIcons.Theme className="w-6 h-6 text-[rgb(var(--color-accent))]" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Appearance Settings</h2>
              <p className="text-sm text-gray-400">
                Customize layout, colors, and style
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
                       Preview
                     </Button>
                     <Button
                       onClick={handleSaveEditedTheme}
                       variant="primary"
                       size="sm"
                       icon={<ActionIcons.Save />}
                     >
                       Save New
                     </Button>
                     <Button
                       onClick={() => setEditingTheme(null)}
                       variant="ghost"
                       size="sm"
                       icon={<ActionIcons.Close />}
                     >
                       Cancel
                     </Button>
                   </div>
                 </div>

                 {/* Color Editor Grid */}
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                   <Card variant="glass" className="p-6">
                     <h4 className="text-lg font-semibold text-white mb-6">Primary Colors</h4>
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
                     <h4 className="text-lg font-semibold text-white mb-6">Background Colors</h4>
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
                                Edit
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

          {activeTab === "background" && (
            <div className="animate-in fade-in duration-300">
              <BackgroundCreator config={backgroundConfig} onChange={updateBackgroundConfig} />
            </div>
          )}

          {activeTab === "header" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <Card variant="glass" className="p-6">
                <div 
                  className="flex justify-between items-center cursor-pointer mb-4"
                  onClick={() => toggleSection('headerStyle')}
                >
                  <h3 className="text-lg font-semibold text-white">Header Style</h3>
                  <ChevronDown className={`w-5 h-5 transition-transform ${collapsedSections.headerStyle ? 'rotate-0' : 'rotate-180'}`} />
                </div>
                {!collapsedSections.headerStyle && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-in fade-in slide-in-from-top-2">
                    {['default', 'centered', 'minimal'].map((style) => (
                      <label key={style} className={`flex flex-col items-center p-4 border rounded-xl cursor-pointer transition-all ${headerConfig.style === style ? 'border-[rgb(var(--color-accent))] bg-[rgb(var(--color-accent))]/10' : 'border-gray-700 hover:border-gray-500 bg-gray-800/50'}`}>
                        <input
                          type="radio"
                          className="sr-only"
                          name="headerStyle"
                          checked={headerConfig.style === style}
                          onChange={() => updateHeaderConfig({ style: style as any })}
                        />
                        <span className="capitalize font-medium text-white">{style}</span>
                      </label>
                    ))}
                  </div>
                )}
              </Card>

              <Card variant="glass" className="p-6">
                <div 
                  className="flex justify-between items-center cursor-pointer mb-4"
                  onClick={() => toggleSection('headerPosition')}
                >
                  <h3 className="text-lg font-semibold text-white">Header Position</h3>
                  <ChevronDown className={`w-5 h-5 transition-transform ${collapsedSections.headerPosition ? 'rotate-0' : 'rotate-180'}`} />
                </div>
                {!collapsedSections.headerPosition && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-in fade-in slide-in-from-top-2">
                    {['static', 'sticky', 'floating'].map((pos) => (
                      <label key={pos} className={`flex flex-col items-center p-4 border rounded-xl cursor-pointer transition-all ${headerConfig.position === pos ? 'border-[rgb(var(--color-accent))] bg-[rgb(var(--color-accent))]/10' : 'border-gray-700 hover:border-gray-500 bg-gray-800/50'}`}>
                        <input
                          type="radio"
                          className="sr-only"
                          name="headerPosition"
                          checked={headerConfig.position === pos}
                          onChange={() => updateHeaderConfig({ position: pos as any })}
                        />
                        <span className="capitalize font-medium text-white">{pos}</span>
                      </label>
                    ))}
                  </div>
                )}
              </Card>

              <Card variant="glass" className="p-6">
                <div 
                  className="flex justify-between items-center cursor-pointer mb-4"
                  onClick={() => toggleSection('headerBranding')}
                >
                  <h3 className="text-lg font-semibold text-white">Branding</h3>
                  <ChevronDown className={`w-5 h-5 transition-transform ${collapsedSections.headerBranding ? 'rotate-0' : 'rotate-180'}`} />
                </div>
                {!collapsedSections.headerBranding && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Page Title</label>
                      <Input
                        value={headerConfig.customTitle}
                        onChange={(e) => updateHeaderConfig({ customTitle: e.target.value })}
                        placeholder="Enter site title..."
                      />
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={headerConfig.showTitle}
                          onChange={(e) => updateHeaderConfig({ showTitle: e.target.checked })}
                          className="rounded border-gray-600 bg-gray-700 text-[rgb(var(--color-accent))]"
                        />
                        <span className="text-sm text-gray-300">Show Title Text</span>
                      </label>
                    </div>

                    <div className="border-t border-white/10 pt-4">
                      <label className="block text-sm font-medium text-gray-300 mb-2">Logo</label>
                      <div className="flex items-center space-x-4">
                        {headerConfig.logoUrl && (
                          <div className="relative group">
                            <img src={headerConfig.logoUrl} alt="Logo Preview" className="h-12 w-auto object-contain bg-gray-800 rounded p-1" />
                            <button 
                              onClick={() => updateHeaderConfig({ logoUrl: null })}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                          </div>
                        )}
                        <label className="cursor-pointer bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors text-sm">
                          Upload Logo
                          <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                        </label>
                      </div>
                    </div>

                    {headerConfig.logoUrl && (
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Logo Size</label>
                        <div className="flex space-x-4">
                          {['sm', 'md', 'lg'].map((size) => (
                            <label key={size} className="flex items-center space-x-2 cursor-pointer">
                              <input
                                type="radio"
                                name="logoSize"
                                checked={headerConfig.logoSize === size}
                                onChange={() => updateHeaderConfig({ logoSize: size as any })}
                                className="text-[rgb(var(--color-accent))]"
                              />
                              <span className="text-sm text-gray-300 uppercase">{size}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            </div>
          )}

          {activeTab === "content" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <Card variant="glass" className="p-6">
                <div 
                  className="flex justify-between items-center cursor-pointer mb-4"
                  onClick={() => toggleSection('contentLayoutMode')}
                >
                  <h3 className="text-lg font-semibold text-white">Layout Mode</h3>
                  <ChevronDown className={`w-5 h-5 transition-transform ${collapsedSections.contentLayoutMode ? 'rotate-0' : 'rotate-180'}`} />
                </div>
                {!collapsedSections.contentLayoutMode && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
                    {[
                      { value: 'default', label: 'Auto (Category Default)', desc: 'Uses the layout configured for the current category' },
                      { value: 'bento', label: 'Bento Grid', desc: 'Asymmetric dashboard grid' },
                      { value: 'brutalist', label: 'Brutalist', desc: 'High contrast, bold typography' },
                      { value: 'compact', label: 'Compact (Data)', desc: 'High density data view' },
                      { value: 'cyberpunk', label: 'Cyberpunk', desc: 'Neon aesthetics and glitch effects' },
                      { value: 'focus', label: 'Focus (Single)', desc: 'Distraction-free reading' },
                      { value: 'gallery', label: 'Gallery (Image)', desc: 'Image-centric layout' },
                      { value: 'immersive', label: 'Immersive', desc: 'Netflix-style visual experience' },
                      { value: 'grid', label: 'Magazine Grid', desc: 'Classic 3-column grid with featured article' },
                      { value: 'list', label: 'List / Portal', desc: 'Compact list with sidebar' },
                      { value: 'masonry', label: 'Masonry', desc: 'Pinterest-style cascading grid' },
                      { value: 'minimal', label: 'Minimal', desc: 'Centered text-focused layout' },
                      { value: 'modern', label: 'Modern Portal', desc: 'High-density editorial layout with hero sections' },
                      { value: 'newspaper', label: 'Newspaper (Classic)', desc: 'Traditional dense news print style' },
                      { value: 'polaroid', label: 'Polaroid', desc: 'Retro instant photo style' },
                      { value: 'split', label: 'Split (ZigZag)', desc: 'Alternating text and image layout' },
                      { value: 'terminal', label: 'Terminal', desc: 'Command line interface style' },
                      { value: 'timeline', label: 'Timeline', desc: 'Vertical chronological feed' },
                    ].sort((a, b) => a.label.localeCompare(b.label)).map((mode) => (
                      <label key={mode.value} className={`flex flex-col p-3 border rounded-xl cursor-pointer transition-all ${contentConfig.layoutMode === mode.value ? 'border-[rgb(var(--color-accent))] bg-[rgb(var(--color-accent))]/10' : 'border-gray-700 hover:border-gray-500 bg-gray-800/50'}`}>
                        <div className="flex items-center mb-1">
                          <input
                            type="radio"
                            className="sr-only"
                            name="layoutMode"
                            checked={contentConfig.layoutMode === mode.value}
                            onChange={() => updateContentConfig({ layoutMode: mode.value as any })}
                          />
                          <span className="font-medium text-white">{mode.label}</span>
                        </div>
                        <span className="text-xs text-gray-400">{mode.desc}</span>
                      </label>
                    ))}
                  </div>
                )}
              </Card>

              <Card variant="glass" className="p-6">
                <div 
                  className="flex justify-between items-center cursor-pointer mb-4"
                  onClick={() => toggleSection('articleMetadata')}
                >
                  <h3 className="text-lg font-semibold text-white">Article Metadata</h3>
                  <ChevronDown className={`w-5 h-5 transition-transform ${collapsedSections.articleMetadata ? 'rotate-0' : 'rotate-180'}`} />
                </div>
                {!collapsedSections.articleMetadata && (
                  <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                    {[
                      { key: 'showAuthor', label: 'Show Author' },
                      { key: 'showDate', label: 'Show Date' },
                      { key: 'showTime', label: 'Show Time' },
                      { key: 'showTags', label: 'Show Tags/Source' },
                    ].map((item) => (
                      <label key={item.key} className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg cursor-pointer hover:bg-gray-800/50 transition-colors">
                        <span className="text-gray-300">{item.label}</span>
                        <div className="relative">
                          <input
                            type="checkbox"
                            checked={contentConfig[item.key as keyof typeof contentConfig] as boolean}
                            onChange={(e) => updateContentConfig({ [item.key]: e.target.checked })}
                            className="sr-only peer"
                          />
                          <div className="w-10 h-6 bg-gray-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[rgb(var(--color-accent))]"></div>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </Card>

              <Card variant="glass" className="p-6">
                <div 
                  className="flex justify-between items-center cursor-pointer mb-4"
                  onClick={() => toggleSection('layoutDensity')}
                >
                  <h3 className="text-lg font-semibold text-white">Layout Density</h3>
                  <ChevronDown className={`w-5 h-5 transition-transform ${collapsedSections.layoutDensity ? 'rotate-0' : 'rotate-180'}`} />
                </div>
                {!collapsedSections.layoutDensity && (
                  <div className="grid grid-cols-3 gap-4 animate-in fade-in slide-in-from-top-2">
                    {['compact', 'comfortable', 'spacious'].map((density) => (
                      <label key={density} className={`flex flex-col items-center p-3 border rounded-xl cursor-pointer transition-all ${contentConfig.density === density ? 'border-[rgb(var(--color-accent))] bg-[rgb(var(--color-accent))]/10' : 'border-gray-700 hover:border-gray-500 bg-gray-800/50'}`}>
                        <input
                          type="radio"
                          className="sr-only"
                          name="density"
                          checked={contentConfig.density === density}
                          onChange={() => updateContentConfig({ density: density as any })}
                        />
                        <span className="capitalize font-medium text-white text-sm">{density}</span>
                      </label>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          )}

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
                      Export your current theme to share with others or backup your
                      customizations.
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
                      Import a theme from JSON data.
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
                          placeholder='{"id": "custom-theme", ...}'
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
