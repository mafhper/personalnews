import React, { useState, useCallback } from "react";
import type { ThemePreset, ExtendedTheme } from "../types";
import { useExtendedTheme } from "../hooks/useExtendedTheme";
import { exportTheme, importTheme, hexToRgb } from "../services/themeUtils";
import { useNotificationReplacements } from "../hooks/useNotificationReplacements";
import { Card } from "./ui/Card";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { Tabs } from "./ui/Tabs";
import { Badge } from "./ui/Badge";
import { IconButton } from "./ui/IconButton";
import { ActionIcons, StatusIcons } from "./icons";
import { Modal } from "./Modal";

interface ThemeCustomizerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ThemeCustomizer: React.FC<ThemeCustomizerProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    currentTheme,
    defaultPresets,
    customThemes,
    setCurrentTheme,
    removeCustomTheme,
  } = useExtendedTheme();

  // Hook para notificações integradas
  const { alertSuccess, alertError } = useNotificationReplacements();

  const [activeTab, setActiveTab] = useState<
    "presets" | "editor" | "import-export"
  >("presets");
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
    setActiveTab("editor");
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
    setActiveTab("presets");
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

  const tabs = [
    { id: "presets", label: "Theme Presets", icon: <StatusIcons.Theme /> },
    { id: "editor", label: "Color Editor", icon: <ActionIcons.Edit /> },
    {
      id: "import-export",
      label: "Import/Export",
      icon: <ActionIcons.Export />,
    },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} ariaLabel="Theme Customizer">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-[rgb(var(--color-accent))]/10">
              <StatusIcons.Theme className="w-6 h-6 text-[rgb(var(--color-accent))]" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Theme Customizer</h2>
              <p className="text-sm text-gray-400">
                {defaultPresets.length + customThemes.length} themes available
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
          {activeTab === "presets" && (
            <div className="space-y-8 animate-in fade-in duration-300">
              {/* Dark Themes Section */}
              <div>
                <div className="flex items-center mb-4">
                  <span className="text-xl mr-2">🌙</span>
                  <h3 className="text-lg font-semibold text-white">
                    Dark Themes
                  </h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {defaultPresets
                    .filter((preset) => preset.category === "dark")
                    .map((preset) => (
                      <Card
                        key={preset.id}
                        variant={currentTheme.id === preset.id ? "glass" : "outline"}
                        className={`cursor-pointer transition-all duration-200 hover:scale-[1.02] ${currentTheme.id === preset.id
                            ? "ring-1 ring-[rgb(var(--color-accent))]"
                            : "hover:border-white/20"
                          }`}
                        onClick={() => handlePresetSelect(preset)}
                      >
                        {/* Color Preview */}
                        <div className="flex space-x-2 mb-3">
                          {[
                            preset.theme.colors.primary,
                            preset.theme.colors.accent,
                            preset.theme.colors.background,
                          ].map((color, index) => (
                            <div
                              key={index}
                              className="w-8 h-8 rounded-full border border-white/10 shadow-sm"
                              style={{ backgroundColor: `rgb(${color})` }}
                            />
                          ))}
                        </div>

                        <h4 className="font-semibold text-white mb-1">
                          {preset.name}
                        </h4>
                        <p className="text-xs text-gray-400 line-clamp-2 mb-3">
                          {preset.description}
                        </p>

                        <div className="flex items-center justify-between mt-auto">
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={<ActionIcons.Edit />}
                            onClick={(e) => {
                              e?.stopPropagation();
                              handleEditTheme(preset.theme);
                            }}
                            className="text-xs"
                          >
                            Edit
                          </Button>
                          {currentTheme.id === preset.id && (
                            <Badge variant="primary" className="text-xs">
                              Active
                            </Badge>
                          )}
                        </div>
                      </Card>
                    ))}
                </div>
              </div>

              {/* Light Themes Section */}
              <div>
                <div className="flex items-center mb-4">
                  <span className="text-xl mr-2">☀️</span>
                  <h3 className="text-lg font-semibold text-white">
                    Light Themes
                  </h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {defaultPresets
                    .filter((preset) => preset.category === "light")
                    .map((preset) => (
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
                          {[
                            preset.theme.colors.primary,
                            preset.theme.colors.accent,
                            preset.theme.colors.background,
                          ].map((color, index) => (
                            <div
                              key={index}
                              className="w-8 h-8 rounded-full border border-white/10 shadow-sm"
                              style={{ backgroundColor: `rgb(${color})` }}
                            />
                          ))}
                        </div>

                        <h4 className="font-semibold text-white mb-1">
                          {preset.name}
                        </h4>
                        <p className="text-xs text-gray-400 line-clamp-2 mb-3">
                          {preset.description}
                        </p>

                        <div className="flex items-center justify-between mt-auto">
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={<ActionIcons.Edit />}
                            onClick={(e) => {
                              e?.stopPropagation();
                              handleEditTheme(preset.theme);
                            }}
                            className="text-xs"
                          >
                            Edit
                          </Button>
                          {currentTheme.id === preset.id && (
                            <Badge variant="primary" className="text-xs">
                              Active
                            </Badge>
                          )}
                        </div>
                      </Card>
                    ))}
                </div>
              </div>

              {/* Custom Themes Section */}
              {customThemes.length > 0 && (
                <div>
                  <div className="flex items-center mb-4">
                    <span className="text-xl mr-2">🎨</span>
                    <h3 className="text-lg font-semibold text-white">
                      Custom Themes
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {customThemes.map((theme) => (
                      <Card
                        key={theme.id}
                        variant={currentTheme.id === theme.id ? "glass" : "outline"}
                        className={`cursor-pointer transition-all duration-200 hover:scale-[1.02] ${currentTheme.id === theme.id
                            ? "ring-1 ring-[rgb(var(--color-accent))]"
                            : "hover:border-white/20"
                          }`}
                        onClick={() => setCurrentTheme(theme)}
                      >
                        <div className="flex space-x-2 mb-3">
                          {[
                            theme.colors.primary,
                            theme.colors.accent,
                            theme.colors.background,
                          ].map((color, index) => (
                            <div
                              key={index}
                              className="w-8 h-8 rounded-full border border-white/10 shadow-sm"
                              style={{ backgroundColor: `rgb(${color})` }}
                            />
                          ))}
                        </div>

                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-semibold text-white">
                            {theme.name}
                          </h4>
                          <IconButton
                            onClick={(e) => {
                              e?.stopPropagation();
                              removeCustomTheme(theme.id);
                            }}
                            variant="ghost"
                            size="sm"
                            icon={<ActionIcons.Delete />}
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                            title="Delete theme"
                          />
                        </div>

                        <div className="flex items-center justify-between mt-2">
                          <Badge
                            variant="secondary"
                            className="bg-purple-500/10 text-purple-300 border-purple-500/20"
                          >
                            Custom
                          </Badge>
                          {currentTheme.id === theme.id && (
                            <Badge variant="primary" className="text-xs">
                              Active
                            </Badge>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "editor" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              {!editingTheme ? (
                <div className="text-center py-12">
                  <div className="mb-8">
                    <div className="w-20 h-20 mx-auto bg-gray-800/50 rounded-full flex items-center justify-center mb-4">
                      <ActionIcons.Edit className="w-10 h-10 text-gray-400" />
                    </div>
                    <h3 className="text-2xl font-semibold text-white mb-3">
                      Select a Theme to Edit
                    </h3>
                    <p className="text-gray-400 max-w-md mx-auto">
                      Choose a theme below to start customizing colors and
                      create your own personalized version
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
                    {defaultPresets.slice(0, 3).map((preset) => (
                      <Card
                        key={preset.id}
                        variant="outline"
                        className="cursor-pointer hover:border-[rgb(var(--color-accent))] transition-all hover:bg-white/5"
                        onClick={() => handleEditTheme(preset.theme)}
                      >
                        <div className="flex space-x-2 mb-3 justify-center">
                          {[
                            preset.theme.colors.primary,
                            preset.theme.colors.accent,
                            preset.theme.colors.background,
                          ].map((color, index) => (
                            <div
                              key={index}
                              className="w-6 h-6 rounded-full border border-white/10"
                              style={{ backgroundColor: `rgb(${color})` }}
                            />
                          ))}
                        </div>
                        <h4 className="text-white font-medium">
                          {preset.name}
                        </h4>
                      </Card>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Editor Header */}
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-gray-800/30 p-4 rounded-xl border border-white/5">
                    <div>
                      <h3 className="text-xl font-semibold text-white mb-1 flex items-center">
                        <ActionIcons.Edit className="w-5 h-5 mr-2 text-[rgb(var(--color-accent))]" />
                        Editing: {editingTheme.name}
                      </h3>
                      <p className="text-sm text-gray-400">
                        Adjust colors individually to create your personalized version
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
                        onClick={() => {
                          setEditingTheme(null);
                          setActiveTab("presets");
                        }}
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
                    {/* Primary Colors */}
                    <Card variant="glass" className="p-6">
                      <h4 className="text-lg font-semibold text-white mb-6 flex items-center">
                        <StatusIcons.Theme className="w-5 h-5 mr-2 text-blue-400" />
                        Primary Colors
                      </h4>
                      <div className="space-y-6">
                        {[
                          { key: 'primary', label: 'Primary Color', placeholder: '#1976D2' },
                          { key: 'accent', label: 'Accent Color', placeholder: '#F4511E' },
                          { key: 'secondary', label: 'Secondary Color', placeholder: '#F5F5F5' }
                        ].map((color) => (
                          <div key={color.key}>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                              {color.label}
                            </label>
                            <div className="flex items-center space-x-3">
                              <div className="relative group">
                                <input
                                  type="color"
                                  value={rgbToHex(editingTheme.colors[color.key as keyof typeof editingTheme.colors] as string)}
                                  onChange={(e) =>
                                    handleColorChange(color.key, e.target.value)
                                  }
                                  className="w-10 h-10 rounded-lg border-0 p-0 cursor-pointer opacity-0 absolute inset-0"
                                />
                                <div
                                  className="w-10 h-10 rounded-lg border border-white/20 shadow-sm"
                                  style={{ backgroundColor: `rgb(${editingTheme.colors[color.key as keyof typeof editingTheme.colors]})` }}
                                />
                              </div>
                              <Input
                                type="text"
                                value={rgbToHex(editingTheme.colors[color.key as keyof typeof editingTheme.colors] as string)}
                                onChange={(e) =>
                                  handleColorChange(color.key, e.target.value)
                                }
                                placeholder={color.placeholder}
                                className="flex-1 font-mono text-sm"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </Card>

                    {/* Background Colors */}
                    <Card variant="glass" className="p-6">
                      <h4 className="text-lg font-semibold text-white mb-6 flex items-center">
                        <div className="w-5 h-5 mr-2 bg-gray-700 rounded border border-gray-500"></div>
                        Background Colors
                      </h4>
                      <div className="space-y-6">
                        {[
                          { key: 'background', label: 'Background Color', placeholder: '#121212' },
                          { key: 'surface', label: 'Surface Color', placeholder: '#1E1E1E' },
                          { key: 'text', label: 'Text Color', placeholder: '#FFFFFF' }
                        ].map((color) => (
                          <div key={color.key}>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                              {color.label}
                            </label>
                            <div className="flex items-center space-x-3">
                              <div className="relative group">
                                <input
                                  type="color"
                                  value={rgbToHex(editingTheme.colors[color.key as keyof typeof editingTheme.colors] as string)}
                                  onChange={(e) =>
                                    handleColorChange(color.key, e.target.value)
                                  }
                                  className="w-10 h-10 rounded-lg border-0 p-0 cursor-pointer opacity-0 absolute inset-0"
                                />
                                <div
                                  className="w-10 h-10 rounded-lg border border-white/20 shadow-sm"
                                  style={{ backgroundColor: `rgb(${editingTheme.colors[color.key as keyof typeof editingTheme.colors]})` }}
                                />
                              </div>
                              <Input
                                type="text"
                                value={rgbToHex(editingTheme.colors[color.key as keyof typeof editingTheme.colors] as string)}
                                onChange={(e) =>
                                  handleColorChange(color.key, e.target.value)
                                }
                                placeholder={color.placeholder}
                                className="flex-1 font-mono text-sm"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </Card>
                  </div>

                  {/* Preview Section */}
                  <Card variant="outline" className="p-6 bg-black/20">
                    <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
                      <StatusIcons.Preview className="w-5 h-5 mr-2" />
                      Color Palette Preview
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
                      {Object.entries(editingTheme.colors).map(
                        ([colorName, colorValue]) => (
                          <div key={colorName} className="text-center group">
                            <div
                              className="w-full h-16 rounded-lg border border-white/10 mb-2 shadow-sm group-hover:scale-105 transition-transform"
                              style={{ backgroundColor: `rgb(${colorValue})` }}
                            />
                            <p className="text-xs text-gray-300 font-medium capitalize">
                              {colorName.replace(/([A-Z])/g, " $1").trim()}
                            </p>
                            <p className="text-[10px] text-gray-500 font-mono">
                              {rgbToHex(colorValue as string)}
                            </p>
                          </div>
                        )
                      )}
                    </div>
                  </Card>
                </div>
              )}
            </div>
          )}

          {activeTab === "import-export" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              {/* Export Section */}
              <Card variant="glass" className="p-6">
                <h3 className="text-xl font-semibold text-white mb-2 flex items-center">
                  <ActionIcons.Export className="w-5 h-5 mr-2 text-blue-400" />
                  Export Theme
                </h3>
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
              </Card>

              {/* Import Section */}
              <Card variant="glass" className="p-6">
                <h3 className="text-xl font-semibold text-white mb-2 flex items-center">
                  <ActionIcons.Import className="w-5 h-5 mr-2 text-green-400" />
                  Import Theme
                </h3>
                <p className="text-gray-400 mb-6 text-sm">
                  Import a theme from JSON data. This will apply the theme
                  immediately.
                </p>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Paste Theme JSON
                    </label>
                    <textarea
                      value={importText}
                      onChange={(e) => setImportText(e.target.value)}
                      placeholder="Paste theme JSON here..."
                      rows={6}
                      className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-lg text-white font-mono text-xs focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-accent))] resize-none"
                    />
                  </div>
                  <Button
                    onClick={handleImport}
                    disabled={!importText.trim()}
                    variant="primary"
                    icon={<ActionIcons.Import />}
                    className="w-full sm:w-auto"
                  >
                    Import Theme
                  </Button>
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
