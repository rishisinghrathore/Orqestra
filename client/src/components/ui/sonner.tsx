import { useTheme } from "@/components/theme-provider"
import { Toaster as Sonner, type ToasterProps } from "sonner"

function SonnerToaster({ ...props }: ToasterProps) {
  const { theme } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position="bottom-right"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-transparent group-[.toaster]:border-0 group-[.toaster]:shadow-none group-[.toaster]:p-0",
        },
      }}
      {...props}
    />
  )
}

export { SonnerToaster }
export { toast } from "sonner"
