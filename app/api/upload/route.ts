import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Vérifier le type de fichier
    const allowedTypes = [
      'image/jpeg', 
      'image/png', 
      'image/gif', 
      'image/webp',
      'application/pdf'
    ];
    
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Type de fichier non autorisé. Seuls les images (JPEG, PNG, GIF, WEBP) et PDF sont acceptés.' },
        { status: 400 }
      );
    }

    // Lire le fichier
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Créer le dossier s'il n'existe pas
    const uploadDir = path.join(process.cwd(), 'public', 'proofs');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Générer un nom de fichier unique
    const timestamp = Date.now();
    const ext = path.extname(file.name) || 
               (file.type === 'application/pdf' ? '.pdf' : '.jpg');
    const filename = `${timestamp}${ext}`;
    const filePath = path.join(uploadDir, filename);

    // Écrire le fichier
    await fs.promises.writeFile(filePath, buffer);

    // Retourner l'URL complète
    const fullUrl = `${process.env.NEXT_PUBLIC_SITE_URL || ''}/proofs/${filename}`;

   return NextResponse.json({
  success: true,
  filePath: `/proofs/${filename}` // Retourne le chemin relatif seulement
});
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}