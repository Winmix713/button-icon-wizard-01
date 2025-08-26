import React, { useState } from 'react';
import { useFigmaApi } from '@/hooks/useFigmaApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Settings, Shield, Zap, CheckCircle, AlertTriangle, Info, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function FigmaSettingsPanel() {
  const { toast } = useToast();
  const { hasToken, setToken, clearToken, testConnection } = useFigmaApi();
  
  const [useProxy, setUseProxy] = useState(true);
  const [mockMode, setMockMode] = useState(import.meta.env.DEV);
  const [personalToken, setPersonalToken] = useState('');
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleTokenSubmit = () => {
    if (!personalToken.trim()) {
      toast({
        title: "Hiányzó token",
        description: "Kérlek add meg a Figma Personal Access Token-t.",
        variant: "destructive",
      });
      return;
    }

    setToken(personalToken);
    toast({
      title: "Token beállítva",
      description: "Figma Personal Access Token sikeresen elmentve.",
    });
  };

  const handleClearToken = () => {
    clearToken();
    setPersonalToken('');
    setConnectionStatus('idle');
    toast({
      title: "Token törölve",
      description: "Figma token eltávolítva.",
    });
  };

  const handleTestConnection = async () => {
    setIsTestingConnection(true);
    setConnectionStatus('idle');

    try {
      const isConnected = await testConnection();
      setConnectionStatus(isConnected ? 'success' : 'error');
      
      toast({
        title: isConnected ? "Kapcsolat sikeres" : "Kapcsolat sikertelen",
        description: isConnected 
          ? "Figma API kapcsolat működik." 
          : "Nem sikerült kapcsolódni a Figma API-hoz.",
        variant: isConnected ? "default" : "destructive",
      });
    } catch (error) {
      setConnectionStatus('error');
      toast({
        title: "Kapcsolat hiba",
        description: "Hiba történt a kapcsolat tesztelése során.",
        variant: "destructive",
      });
    } finally {
      setIsTestingConnection(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Connection Mode */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="w-5 h-5" />
            <span>Kapcsolódási Mód</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Proxy vs Direct Mode */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Biztonságos Proxy Mód</Label>
                <p className="text-sm text-gray-600">
                  Supabase Edge Function segítségével, token a szerveren marad
                </p>
              </div>
              <Switch
                checked={useProxy}
                onCheckedChange={setUseProxy}
              />
            </div>

            {useProxy ? (
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  <strong>Ajánlott beállítás.</strong> A Figma token biztonságosan a Supabase szerveren tárolódik. 
                  Nincs szükség Personal Access Token megadására a böngészőben.
                </AlertDescription>
              </Alert>
            ) : (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Közvetlen mód.</strong> A Figma token a böngészőben kerül tárolásra. 
                  Csak saját tokenekkel és fejlesztési célokra ajánlott.
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Developer Mode */}
          <div className="space-y-3 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Fejlesztői Mock Mód</Label>
                <p className="text-sm text-gray-600">
                  Tesztadatok használata valós API hívások helyett
                </p>
              </div>
              <Switch
                checked={mockMode}
                onCheckedChange={setMockMode}
              />
            </div>

            {mockMode && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Mock mód aktív. Az alkalmazás tesztadatokat használ valós Figma API hívások helyett.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Personal Token Management (Direct Mode Only) */}
      {!useProxy && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Settings className="w-5 h-5" />
              <span>Personal Access Token</span>
              {hasToken() && <Badge variant="outline" className="text-green-600">Beállítva</Badge>}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="figma-token">Figma Personal Access Token</Label>
              <div className="flex space-x-2">
                <Input
                  id="figma-token"
                  type="password"
                  placeholder="figd_..."
                  value={personalToken}
                  onChange={(e) => setPersonalToken(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={handleTokenSubmit} disabled={!personalToken.trim()}>
                  Beállítás
                </Button>
              </div>
              <p className="text-sm text-gray-600">
                Personal Access Token szükséges a Figma API eléréséhez közvetlen módban.
              </p>
            </div>

            {hasToken() && (
              <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-green-800">Token sikeresen beállítva</span>
                </div>
                <Button variant="outline" size="sm" onClick={handleClearToken}>
                  Törlés
                </Button>
              </div>
            )}

            <div className="space-y-2">
              <Button 
                variant="outline" 
                onClick={() => window.open('https://www.figma.com/developers/api#access-tokens', '_blank')}
                className="w-full"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Figma Token Generálása
              </Button>
              
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  <strong>Token biztonsága:</strong> A személyes hozzáférési token csak a böngésző memóriájában tárolódik. 
                  Minden munkamenet végén újra meg kell adnod.
                </AlertDescription>
              </Alert>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Connection Test */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Zap className="w-5 h-5" />
            <span>Kapcsolat Tesztelése</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600">
            Ellenőrizd a Figma API kapcsolatot az aktuális beállításokkal.
          </p>

          <div className="flex items-center space-x-4">
            <Button 
              onClick={handleTestConnection}
              disabled={isTestingConnection || (!hasToken() && !useProxy && !mockMode)}
            >
              {isTestingConnection ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Tesztelés...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Zap className="w-4 h-4" />
                  <span>Kapcsolat Tesztelése</span>
                </div>
              )}
            </Button>

            {connectionStatus === 'success' && (
              <div className="flex items-center space-x-2 text-green-600">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm">Kapcsolat OK</span>
              </div>
            )}

            {connectionStatus === 'error' && (
              <div className="flex items-center space-x-2 text-red-600">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-sm">Kapcsolat hiba</span>
              </div>
            )}
          </div>

          {/* Connection Status Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200">
            <div className="text-center">
              <div className="text-sm text-gray-600">Mód</div>
              <Badge variant={useProxy ? "default" : "outline"}>
                {useProxy ? "Proxy" : "Közvetlen"}
              </Badge>
            </div>
            
            <div className="text-center">
              <div className="text-sm text-gray-600">Token</div>
              <Badge variant={hasToken() || useProxy ? "default" : "destructive"}>
                {hasToken() || useProxy ? "Beállítva" : "Hiányzik"}
              </Badge>
            </div>

            <div className="text-center">
              <div className="text-sm text-gray-600">Mock</div>
              <Badge variant={mockMode ? "outline" : "default"}>
                {mockMode ? "Aktív" : "Inaktív"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Documentation Links */}
      <Card>
        <CardHeader>
          <CardTitle>Dokumentáció és Segítség</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button 
            variant="outline" 
            onClick={() => window.open('https://www.figma.com/developers/api', '_blank')}
            className="w-full justify-start"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Figma API Dokumentáció
          </Button>
          
          <Button 
            variant="outline" 
            onClick={() => window.open('https://www.figma.com/developers/api#authentication', '_blank')}
            className="w-full justify-start"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Token Generálási Útmutató
          </Button>

          <Button 
            variant="outline" 
            onClick={() => window.open('https://help.figma.com/hc/en-us/articles/8085703771159-Manage-personal-access-tokens', '_blank')}
            className="w-full justify-start"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Token Kezelése a Figmában
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}