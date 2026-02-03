import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { CVData } from "@/lib/schemas/cv";

interface CvDataViewProps {
  cvData: CVData;
  title?: string;
}

export function CvDataView({ cvData, title = "Din CV" }: CvDataViewProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="rounded-lg bg-muted p-4">
          <h3 className="font-semibold">{cvData.personalInfo.name}</h3>
          {cvData.personalInfo.email && (
            <p className="text-sm text-muted-foreground">
              {cvData.personalInfo.email}
            </p>
          )}
          {cvData.personalInfo.location && (
            <p className="text-sm text-muted-foreground">
              {cvData.personalInfo.location}
            </p>
          )}
        </div>

        {cvData.summary && (
          <div>
            <h4 className="text-sm font-medium">Sammendrag</h4>
            <p className="text-sm text-muted-foreground">{cvData.summary}</p>
          </div>
        )}

        {cvData.experience.length > 0 && (
          <div>
            <h4 className="text-sm font-medium">
              Erfaring ({cvData.experience.length})
            </h4>
            <ul className="mt-1 space-y-1">
              {cvData.experience.slice(0, 5).map((exp, i) => (
                <li key={i} className="text-sm text-muted-foreground">
                  {exp.title} @ {exp.company}
                </li>
              ))}
              {cvData.experience.length > 5 && (
                <li className="text-sm text-muted-foreground">
                  +{cvData.experience.length - 5} mer
                </li>
              )}
            </ul>
          </div>
        )}

        {cvData.skills.length > 0 && (
          <div>
            <h4 className="text-sm font-medium">Ferdigheter</h4>
            <div className="mt-1 flex flex-wrap gap-1">
              {cvData.skills.slice(0, 12).map((skill, i) => (
                <span
                  key={i}
                  className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary"
                >
                  {skill}
                </span>
              ))}
              {cvData.skills.length > 12 && (
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                  +{cvData.skills.length - 12}
                </span>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
