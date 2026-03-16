export type DoctorName = 'mendoza' | 'castillo' | 'navarro';

export type FaceExpression = 
  | 'idle'         // Guardia tranquila
  | 'focus'        // Leyendo expediente
  | 'disappointed' // Facepalm (Rango B o D)
  | 'angry'        // Grito letal (GHOSTED)
  | 'approval';    // Asentimiento (Rango S)

export interface AvatarFeedbackProps {
  doctor: DoctorName;
  expression: FaceExpression;
  dialogueText?: string | null; 
  isVisible: boolean;
}
