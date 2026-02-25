"use client";
import React, { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import ConfirmationModal from "@/app/components/modal/ConfirmationModal";
import { KycStatus, KycVerification } from "@/types";

interface KycDetailsFormProps {
  type: "update";
  id: string;
  onModalClose?: () => void;
  onSuccess?: (data?: any) => void;
}

const KycDetailsForm = ({ type, id, onSuccess, onModalClose }: KycDetailsFormProps) => {
  const { showSuccess, showError } = useToast();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<KycVerification | null>(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (type === "update" && id) {
      const fetchKyc = async () => {
        setLoading(true);
        try {
          const response = await fetch(`/api/admin/kyc/${id}`);
          if (!response.ok) throw new Error('Failed to fetch KYC');
          
          const result = await response.json();
          if (result.success && result.data) {
            setData(result.data);
          } else {
            throw new Error(result.error || "Failed to load KYC data");
          }
        } catch (error) {
          console.error("Error loading KYC:", error);
          showError("Erreur lors du chargement des données KYC");
        } finally {
          setLoading(false);
        }
      };

      fetchKyc();
    }
  }, [type, id, showError]);

  const handleUpdateStatus = async (status: KycStatus) => {
    setProcessing(true);
    try {
      const response = await fetch(`/api/admin/kyc/update-status/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Failed to update status");

      showSuccess(`KYC ${status === "APPROVED" ? "approuvé" : "rejeté"} avec succès !`);
      if (onSuccess) onSuccess();
      if (onModalClose) onModalClose();
    } catch (error: any) {
      console.error("Error:", error);
      showError(error.message || "Erreur lors de la mise à jour du statut");
    } finally {
      setProcessing(false);
      if (status === "APPROVED") setShowApproveModal(false);
      if (status === "REJECTED") setShowRejectModal(false);
    }
  };

  const formatDocumentType = (type: string) => {
    const types: Record<string, string> = {
      PASSPORT: 'Passeport',
      ID_CARD: "Carte d'identité",
      DRIVER_LICENSE: 'Permis de conduire'
    };
    return types[type] || type;
  };

  const formatStatus = (status: string) => {
    const statuses: Record<string, string> = {
      PENDING: 'En attente',
      APPROVED: 'Approuvé',
      REJECTED: 'Rejeté'
    };
    return statuses[status] || status;
  };

  if (loading) {
    return <p>Chargement des données...</p>;
  }

  if (!data) {
    return <p>Aucune donnée KYC trouvée.</p>;
  }

  return (
    <div className="flex flex-col gap-4 pb-16">
      <h1 className="font-semibold text-lg">Détails de la vérification KYC</h1>

      <div className="flex flex-col gap-2">
        <p className="text-sm text-gray-300">
          <span className="font-medium">Utilisateur :</span> {data.user.email} {data.user.first_name && data.user.last_name ? `(${data.user.first_name} ${data.user.last_name})` : ''}
        </p>
        <p className="text-sm text-gray-300">
          <span className="font-medium">Type de document :</span> {formatDocumentType(data.document_type)}
        </p>
        <p className="text-sm text-gray-300">
          <span className="font-medium">Numéro de document :</span> {data.document_number}
        </p>
        <p className="text-sm text-gray-300">
          <span className="font-medium">Statut :</span> {formatStatus(data.status)}
        </p>
        {data.rejection_reason && (
          <p className="text-sm text-gray-300">
            <span className="font-medium">Raison du rejet :</span> {data.rejection_reason}
          </p>
        )}
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <p className="font-medium text-gray-300 mb-2">Document face avant</p>
          <Image src={data.document_front_url} alt="Document face avant" width={300} height={200} className="rounded-md" />
        </div>
        {data.document_back_url && (
          <div className="flex-1">
            <p className="font-medium text-gray-300 mb-2">Document face arrière</p>
            <Image src={data.document_back_url} alt="Document face arrière" width={300} height={200} className="rounded-md" />
          </div>
        )}
        <div className="flex-1">
          <p className="font-medium text-gray-300 mb-2">Selfie</p>
          <Image src={data.selfie_url} alt="Selfie" width={300} height={200} className="rounded-md" />
        </div>
      </div>

      {data.status === "PENDING" && (
        <div className="flex gap-4 mt-4">
          <button
            className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-md font-semibold"
            onClick={() => setShowApproveModal(true)}
            disabled={processing}
          >
            Approuver
          </button>
          <button
            className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-md font-semibold"
            onClick={() => setShowRejectModal(true)}
            disabled={processing}
          >
            Rejeter
          </button>
        </div>
      )}

      <ConfirmationModal
        isOpen={showApproveModal}
        onClose={() => setShowApproveModal(false)}
        onConfirm={() => handleUpdateStatus("APPROVED")}
        title="Confirmer l'approbation"
        message="Êtes-vous sûr de vouloir approuver cette vérification KYC ?"
        confirmText="Approuver"
        confirmColor="green"
        processing={processing}
      />

      <ConfirmationModal
        isOpen={showRejectModal}
        onClose={() => setShowRejectModal(false)}
        onConfirm={() => handleUpdateStatus("REJECTED")}
        title="Confirmer le rejet"
        message="Êtes-vous sûr de vouloir rejeter cette vérification KYC ?"
        confirmText="Rejeter"
        confirmColor="red"
        processing={processing}
      />
    </div>
  );
};

export default KycDetailsForm;