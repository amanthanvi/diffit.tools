import * as React from 'react';
import { cn } from '../lib/utils';
import { Button } from './button';
import { Separator } from './separator';

export interface ToolbarProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: 'horizontal' | 'vertical';
}

const Toolbar = React.forwardRef<HTMLDivElement, ToolbarProps>(
  ({ className, orientation = 'horizontal', children, ...props }, ref) => (
    <div
      ref={ref}
      role="toolbar"
      aria-orientation={orientation}
      className={cn(
        'flex items-center gap-1 rounded-md border bg-background p-1',
        orientation === 'vertical' && 'flex-col',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
);
Toolbar.displayName = 'Toolbar';

export interface ToolbarGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: 'horizontal' | 'vertical';
}

const ToolbarGroup = React.forwardRef<HTMLDivElement, ToolbarGroupProps>(
  ({ className, orientation = 'horizontal', children, ...props }, ref) => (
    <div
      ref={ref}
      role="group"
      className={cn(
        'flex items-center gap-1',
        orientation === 'vertical' && 'flex-col',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
);
ToolbarGroup.displayName = 'ToolbarGroup';

export interface ToolbarButtonProps
  extends React.ComponentPropsWithoutRef<typeof Button> {
  isActive?: boolean;
}

const ToolbarButton = React.forwardRef<HTMLButtonElement, ToolbarButtonProps>(
  ({ className, variant = 'ghost', size = 'icon', isActive, ...props }, ref) => (
    <Button
      ref={ref}
      variant={isActive ? 'secondary' : variant}
      size={size}
      className={cn(
        'h-8 w-8',
        isActive && 'bg-accent',
        className
      )}
      aria-pressed={isActive}
      {...props}
    />
  )
);
ToolbarButton.displayName = 'ToolbarButton';

const ToolbarSeparator = React.forwardRef<
  React.ElementRef<typeof Separator>,
  React.ComponentPropsWithoutRef<typeof Separator>
>(({ className, orientation = 'vertical', ...props }, ref) => (
  <Separator
    ref={ref}
    orientation={orientation}
    className={cn(
      orientation === 'vertical' ? 'h-4' : 'w-4',
      className
    )}
    {...props}
  />
));
ToolbarSeparator.displayName = 'ToolbarSeparator';

export { Toolbar, ToolbarGroup, ToolbarButton, ToolbarSeparator };