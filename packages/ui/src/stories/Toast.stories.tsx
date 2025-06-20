import type { Meta, StoryObj } from '@storybook/react';
import { Button } from '../components/button';
import { useToast } from '../hooks/use-toast';
import { Toaster } from '../components/toaster';
import { ToastAction } from '../components/toast';

const ToastDemo = () => {
  const { toast } = useToast();

  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        <Button
          onClick={() => {
            toast({
              title: 'Scheduled: Catch up',
              description: 'Friday, February 10, 2023 at 5:57 PM',
            });
          }}
        >
          Show Toast
        </Button>

        <Button
          variant="outline"
          onClick={() => {
            toast({
              title: 'Uh oh! Something went wrong.',
              description: 'There was a problem with your request.',
              variant: 'destructive',
              action: <ToastAction altText="Try again">Try again</ToastAction>,
            });
          }}
        >
          Show Error Toast
        </Button>

        <Button
          variant="secondary"
          onClick={() => {
            toast({
              description: 'Your message has been sent.',
            });
          }}
        >
          Simple Toast
        </Button>

        <Button
          variant="secondary"
          onClick={() => {
            toast({
              title: 'Update available',
              description: 'A new version is available. Please update now.',
              action: (
                <ToastAction altText="Update">Update</ToastAction>
              ),
            });
          }}
        >
          Toast with Action
        </Button>
      </div>
      <Toaster />
    </>
  );
};

const meta = {
  title: 'Components/Toast',
  component: ToastDemo,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const AllVariants: Story = {
  render: () => {
    const { toast } = useToast();

    return (
      <>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold mb-4">Toast Variants</h3>
          <Button
            className="w-full"
            onClick={() => {
              toast({
                title: 'Default Toast',
                description: 'This is a default toast message.',
              });
            }}
          >
            Default Toast
          </Button>

          <Button
            className="w-full"
            variant="destructive"
            onClick={() => {
              toast({
                variant: 'destructive',
                title: 'Destructive Toast',
                description: 'This is a destructive toast message.',
              });
            }}
          >
            Destructive Toast
          </Button>

          <Button
            className="w-full"
            variant="outline"
            onClick={() => {
              toast({
                title: 'Toast with Action',
                description: 'This toast has an action button.',
                action: (
                  <ToastAction altText="Undo">Undo</ToastAction>
                ),
              });
            }}
          >
            Toast with Action
          </Button>

          <Button
            className="w-full"
            variant="secondary"
            onClick={() => {
              toast({
                description: 'This is a simple toast without a title.',
              });
            }}
          >
            Simple Toast (No Title)
          </Button>
        </div>
        <Toaster />
      </>
    );
  },
};