import Link from "next/link";
import { FileQuestion } from "lucide-react";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center bg-background px-4 py-12 sm:px-6">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <div className="mb-2 flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <FileQuestion className="size-5" />
          </div>
          <CardTitle>Siden ble ikke funnet</CardTitle>
          <CardDescription>
            Siden du leter etter finnes ikke. Du kan ha fulgt en utdatert lenke
            eller skrevet inn en feil adresse.
          </CardDescription>
        </CardHeader>
        <CardFooter className="flex flex-col gap-2">
          <Button asChild className="w-full">
            <Link href="/">Gå til forsiden</Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link href="/dashboard">Gå til dashboard</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
