import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import fs from 'fs/promises';
import path from 'path';
import { sanitizePrismaData } from '@/app/lib/utils'; // Assumer que c'est dans utils.ts
import { DocumentType } from '@prisma/client';

const uploadDir = path.join(process.cwd(), 'public/kyc');


// Interface pour les paramètres de route dans Next.js 15
interface RouteParams {
  params: Promise<{ id: string }>;
}
export async function GET(
  request: Request, 
  { params }: RouteParams
) {

  
  try {

    // Résoudre les paramètres asynchrones
    const resolvedParams = await params
    const id = resolvedParams.id

    if (!id || isNaN(Number(id))) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    const userId = BigInt(id);

    const kyc = await prisma.kycVerification.findFirst({
      where: { user_id: userId },
    });

    if (!kyc) {
      return NextResponse.json({ error: 'KYC not found' }, { status: 404 });
    }

    const sanitizedKyc = sanitizePrismaData({
      ...kyc,
      id: kyc.id.toString(),
      user_id: kyc.user_id.toString(),
      reviewed_by: kyc.reviewed_by ? kyc.reviewed_by.toString() : null,
    });

    return NextResponse.json(sanitizedKyc);
  } catch (error) {
    console.error('Error fetching KYC:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: Request, 
  { params }: RouteParams
) {

  
  try {

    // Résoudre les paramètres asynchrones
    const resolvedParams = await params
    const id = resolvedParams.id


    if (!id || isNaN(Number(id))) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    const userId = BigInt(id);

    // Vérifier si KYC existe déjà
    const existingKyc = await prisma.kycVerification.findFirst({
      where: { user_id: userId },
    });

    if (existingKyc) {
      return NextResponse.json({ error: 'KYC already exists' }, { status: 400 });
    }

    const formData = await request.formData();

    const documentType = formData.get('document_type') as string;
    const documentNumber = formData.get('document_number') as string;
    const frontFile = formData.get('document_front_url') as File | null;
    const backFile = formData.get('document_back_url') as File | null;
    const selfieFile = formData.get('selfie_url') as File | null;

    if (!frontFile || !backFile || !selfieFile) {
      return NextResponse.json({ error: 'All documents are required' }, { status: 400 });
    }

    // Créer dir si pas existe
    await fs.mkdir(uploadDir, { recursive: true });

    // Générer noms uniques
    const timestamp = Date.now();
    const frontPath = `/kyc/${timestamp}_${frontFile.name}`;
    const backPath = `/kyc/${timestamp}_${backFile.name}`;
    const selfiePath = `/kyc/${timestamp}_${selfieFile.name}`;

    const fullFrontPath = path.join(uploadDir, `${timestamp}_${frontFile.name}`);
    const fullBackPath = path.join(uploadDir, `${timestamp}_${backFile.name}`);
    const fullSelfiePath = path.join(uploadDir, `${timestamp}_${selfieFile.name}`);

    // Upload fichiers
    const uploadedFiles: string[] = [];
    try {
      await fs.writeFile(fullFrontPath, Buffer.from(await frontFile.arrayBuffer()));
      uploadedFiles.push(fullFrontPath);
      await fs.writeFile(fullBackPath, Buffer.from(await backFile.arrayBuffer()));
      uploadedFiles.push(fullBackPath);
      await fs.writeFile(fullSelfiePath, Buffer.from(await selfieFile.arrayBuffer()));
      uploadedFiles.push(fullSelfiePath);
    } catch (uploadError) {
      // Rollback si upload fail
      for (const filePath of uploadedFiles) {
        await fs.unlink(filePath).catch(() => {});
      }
      return NextResponse.json({ error: 'File upload FAILED' }, { status: 500 });
    }

    // Créer en BDD
    try {
      const newKyc = await prisma.kycVerification.create({
        data: {
          user_id: userId,
          document_type: documentType as DocumentType,
          document_number: documentNumber,
          document_front_url: frontPath,
          document_back_url: backPath,
          selfie_url: selfiePath,
        },
      });

      const sanitizedNewKyc = sanitizePrismaData({
        ...newKyc,
        id: newKyc.id.toString(),
        user_id: newKyc.user_id.toString(),
      });

      return NextResponse.json(sanitizedNewKyc, { status: 201 });
    } catch (dbError) {
      // Rollback fichiers
      for (const filePath of uploadedFiles) {
        await fs.unlink(filePath).catch(() => {});
      }
      console.error('DB error:', dbError);
      return NextResponse.json({ error: 'Database operation FAILED' }, { status: 500 });
    }
  } catch (error) {
    console.error('Error creating KYC:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: Request, 
  { params }: RouteParams
) {

  
  try {

    // Résoudre les paramètres asynchrones
    const resolvedParams = await params
    const id = resolvedParams.id

    if (!id || isNaN(Number(id))) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    const userId = BigInt(id);

    // Vérifier si KYC existe
    const existingKyc = await prisma.kycVerification.findFirst({
      where: { user_id: userId },
    });

    if (!existingKyc) {
      return NextResponse.json({ error: 'KYC not found' }, { status: 404 });
    }

    const formData = await request.formData();

    const documentType = formData.get('document_type') as string;
    const documentNumber = formData.get('document_number') as string;
    const frontFile = formData.get('document_front_url') as File | null;
    const backFile = formData.get('document_back_url') as File | null;
    const selfieFile = formData.get('selfie_url') as File | null;

    if (!frontFile && !backFile && !selfieFile) {
      return NextResponse.json({ error: 'At least one document must be provided for update' }, { status: 400 });
    }

    // Créer dir si pas existe
    await fs.mkdir(uploadDir, { recursive: true });

    // Générer noms uniques pour nouveaux fichiers
    const timestamp = Date.now();
    const uploadedFiles: { type: string; path: string; fullPath: string }[] = [];
    const oldPaths = {
      front: existingKyc.document_front_url,
      back: existingKyc.document_back_url,
      selfie: existingKyc.selfie_url,
    };

    try {
      if (frontFile) {
        const frontPath = `/kyc/${timestamp}_${frontFile.name}`;
        const fullFrontPath = path.join(uploadDir, `${timestamp}_${frontFile.name}`);
        await fs.writeFile(fullFrontPath, Buffer.from(await frontFile.arrayBuffer()));
        uploadedFiles.push({ type: 'front', path: frontPath, fullPath: fullFrontPath });
      }
      if (backFile) {
        const backPath = `/kyc/${timestamp}_${backFile.name}`;
        const fullBackPath = path.join(uploadDir, `${timestamp}_${backFile.name}`);
        await fs.writeFile(fullBackPath, Buffer.from(await backFile.arrayBuffer()));
        uploadedFiles.push({ type: 'back', path: backPath, fullPath: fullBackPath });
      }
      if (selfieFile) {
        const selfiePath = `/kyc/${timestamp}_${selfieFile.name}`;
        const fullSelfiePath = path.join(uploadDir, `${timestamp}_${selfieFile.name}`);
        await fs.writeFile(fullSelfiePath, Buffer.from(await selfieFile.arrayBuffer()));
        uploadedFiles.push({ type: 'selfie', path: selfiePath, fullPath: fullSelfiePath });
      }
    } catch (uploadError) {
      // Rollback nouveaux fichiers
      for (const file of uploadedFiles) {
        await fs.unlink(file.fullPath).catch(() => {});
      }
      return NextResponse.json({ error: 'File upload FAILED' }, { status: 500 });
    }

    // Préparer data pour update
    const updateData: any = {};
    if (documentType) updateData.document_type = documentType as DocumentType;
    if (documentNumber) updateData.document_number = documentNumber;
    if (uploadedFiles.find(f => f.type === 'front')) {
      updateData.document_front_url = uploadedFiles.find(f => f.type === 'front')!.path;
    }
    if (uploadedFiles.find(f => f.type === 'back')) {
      updateData.document_back_url = uploadedFiles.find(f => f.type === 'back')!.path;
    }
    if (uploadedFiles.find(f => f.type === 'selfie')) {
      updateData.selfie_url = uploadedFiles.find(f => f.type === 'selfie')!.path;
    }

    // Update BDD
    try {
      const updatedKyc = await prisma.kycVerification.update({
        where: { id: existingKyc.id },
        data: updateData,
      });

      // Supprimer anciens fichiers si remplacés
      if (uploadedFiles.find(f => f.type === 'front') && oldPaths.front) {
        await fs.unlink(path.join(process.cwd(), 'public', oldPaths.front)).catch(() => {});
      }
      if (uploadedFiles.find(f => f.type === 'back') && oldPaths.back) {
        await fs.unlink(path.join(process.cwd(), 'public', oldPaths.back)).catch(() => {});
      }
      if (uploadedFiles.find(f => f.type === 'selfie') && oldPaths.selfie) {
        await fs.unlink(path.join(process.cwd(), 'public', oldPaths.selfie)).catch(() => {});
      }

      const sanitizedUpdatedKyc = sanitizePrismaData({
        ...updatedKyc,
        id: updatedKyc.id.toString(),
        user_id: updatedKyc.user_id.toString(),
        reviewed_by: updatedKyc.reviewed_by ? updatedKyc.reviewed_by.toString() : null,
      });

      return NextResponse.json(sanitizedUpdatedKyc);
    } catch (dbError) {
      // Rollback nouveaux fichiers
      for (const file of uploadedFiles) {
        await fs.unlink(file.fullPath).catch(() => {});
      }
      console.error('DB error:', dbError);
      return NextResponse.json({ error: 'Database operation FAILED' }, { status: 500 });
    }
  } catch (error) {
    console.error('Error updating KYC:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}