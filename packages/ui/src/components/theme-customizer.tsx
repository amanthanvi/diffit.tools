import * as React from 'react';
import { Moon, Sun, Monitor, Palette } from 'lucide-react';
import { useTheme } from '../hooks/use-theme';
import { Button } from './button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from './dropdown-menu';
import { Label } from './label';
import { Slider } from './slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs';
import { RadioGroup, RadioGroupItem } from './radio-group';
import { cn } from '../lib/utils';

export interface ThemeCustomizerProps {
  className?: string;
}

const ThemeCustomizer = React.forwardRef<HTMLDivElement, ThemeCustomizerProps>(
  ({ className }, ref) => {
    const { theme, setTheme } = useTheme();
    const [radius, setRadius] = React.useState(0.5);
    const [primaryHue, setPrimaryHue] = React.useState(222);

    React.useEffect(() => {
      document.documentElement.style.setProperty(
        '--radius',
        `${radius}rem`
      );
    }, [radius]);

    React.useEffect(() => {
      document.documentElement.style.setProperty(
        '--primary',
        `${primaryHue} 47.4% 11.2%`
      );
    }, [primaryHue]);

    return (
      <div ref={ref} className={cn(className)}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" aria-label="Customize theme">
              <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel>Theme Customization</DropdownMenuLabel>
            <DropdownMenuSeparator />
            
            <Tabs defaultValue="theme" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="theme">Theme</TabsTrigger>
                <TabsTrigger value="colors">Colors</TabsTrigger>
                <TabsTrigger value="styles">Styles</TabsTrigger>
              </TabsList>
              
              <TabsContent value="theme" className="space-y-4 p-4">
                <div className="space-y-2">
                  <Label>Appearance</Label>
                  <RadioGroup value={theme} onValueChange={setTheme}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="light" id="light" />
                      <Label htmlFor="light" className="flex items-center gap-2 cursor-pointer">
                        <Sun className="h-4 w-4" />
                        Light
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="dark" id="dark" />
                      <Label htmlFor="dark" className="flex items-center gap-2 cursor-pointer">
                        <Moon className="h-4 w-4" />
                        Dark
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="system" id="system" />
                      <Label htmlFor="system" className="flex items-center gap-2 cursor-pointer">
                        <Monitor className="h-4 w-4" />
                        System
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
              </TabsContent>
              
              <TabsContent value="colors" className="space-y-4 p-4">
                <div className="space-y-2">
                  <Label htmlFor="primary-color">Primary Color</Label>
                  <div className="flex items-center gap-4">
                    <Slider
                      id="primary-color"
                      min={0}
                      max={360}
                      step={1}
                      value={[primaryHue]}
                      onValueChange={([value]) => setPrimaryHue(value)}
                      className="flex-1"
                      aria-label="Primary color hue"
                    />
                    <div
                      className="h-8 w-8 rounded-md border"
                      style={{
                        backgroundColor: `hsl(${primaryHue}, 47.4%, 40%)`,
                      }}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { name: 'Blue', hue: 217 },
                    { name: 'Green', hue: 142 },
                    { name: 'Orange', hue: 24 },
                    { name: 'Purple', hue: 262 },
                    { name: 'Red', hue: 0 },
                    { name: 'Yellow', hue: 47 },
                    { name: 'Pink', hue: 346 },
                    { name: 'Cyan', hue: 189 },
                  ].map((color) => (
                    <button
                      key={color.name}
                      className="h-8 w-full rounded-md border transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                      style={{
                        backgroundColor: `hsl(${color.hue}, 47.4%, 40%)`,
                      }}
                      onClick={() => setPrimaryHue(color.hue)}
                      aria-label={`Set primary color to ${color.name}`}
                    />
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="styles" className="space-y-4 p-4">
                <div className="space-y-2">
                  <Label htmlFor="border-radius">Border Radius</Label>
                  <div className="flex items-center gap-4">
                    <Slider
                      id="border-radius"
                      min={0}
                      max={1}
                      step={0.1}
                      value={[radius]}
                      onValueChange={([value]) => setRadius(value)}
                      className="flex-1"
                      aria-label="Border radius"
                    />
                    <span className="text-sm text-muted-foreground w-12">
                      {radius}rem
                    </span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Preview</Label>
                  <div className="grid grid-cols-3 gap-2">
                    <div
                      className="h-12 border bg-card rounded-md"
                      style={{ borderRadius: `${radius}rem` }}
                    />
                    <Button size="sm" style={{ borderRadius: `${radius}rem` }}>
                      Button
                    </Button>
                    <div
                      className="h-12 bg-primary rounded-md"
                      style={{ borderRadius: `${radius}rem` }}
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  }
);

ThemeCustomizer.displayName = 'ThemeCustomizer';

export { ThemeCustomizer };