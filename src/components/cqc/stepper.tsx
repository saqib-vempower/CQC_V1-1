import { cn } from '@/lib/utils';

type StepperProps = {
  currentStep: number;
};

const steps = [
  { id: 1, name: 'Upload & Transcribe' },
  { id: 2, name: 'Score Rubric' },
  { id: 3, name: 'View Results' },
];

export function Stepper({ currentStep }: StepperProps) {
  return (
    <nav aria-label="Progress">
      <ol role="list" className="space-y-4 md:flex md:space-x-8 md:space-y-0">
        {steps.map((step) => (
          <li key={step.name} className="md:flex-1">
            {currentStep > step.id ? (
              <div className="group flex w-full flex-col border-l-4 border-primary py-2 pl-4 transition-colors md:border-l-0 md:border-t-4 md:pl-0 md:pt-4 md:pb-0">
                <span className="text-sm font-medium text-primary">{`Step ${step.id}`}</span>
                <span className="text-sm font-medium">{step.name}</span>
              </div>
            ) : currentStep === step.id ? (
              <div
                className="flex w-full flex-col border-l-4 border-primary py-2 pl-4 md:border-l-0 md:border-t-4 md:pl-0 md:pt-4 md:pb-0"
                aria-current="step"
              >
                <span className="text-sm font-medium text-primary">{`Step ${step.id}`}</span>
                <span className="text-sm font-medium">{step.name}</span>
              </div>
            ) : (
              <div className="group flex w-full flex-col border-l-4 border-border py-2 pl-4 transition-colors md:border-l-0 md:border-t-4 md:pl-0 md:pt-4 md:pb-0">
                <span className="text-sm font-medium text-muted-foreground">{`Step ${step.id}`}</span>
                <span className="text-sm font-medium text-muted-foreground">{step.name}</span>
              </div>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
