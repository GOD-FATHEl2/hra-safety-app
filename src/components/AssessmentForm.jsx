import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, CheckCircle, X } from 'lucide-react';
import { submitAssessment } from '../api/assessments';

const SAFETY_QUESTIONS = [
  "Risker/resternergier bedömda (Safety Placard som stöd)?",
  "Fallrisker eliminerade?",
  "Kläm-/skär-/kraftrisker hanterade?",
  "Rätt verktyg/PPE tillgängligt?",
  "Tillstånd/behörighet (heta arbeten/slutna utrymmen) klart?",
  "Snubbel/olja/lösa föremål undanröjda?",
  "Avspärrningar/kommunikation/skyltning klar?",
  "Utrustning i gott skick för lyft/lastsäkring?",
  "Nödvändig utrustning kontrollerad före användning?",
  "Känt var nödstopp/utrymning/ögondusch finns?"
];

const RiskBadge = ({ score }) => {
  const level = score <= 4 ? 'low' : score <= 9 ? 'medium' : 'high';
  const colors = {
    low: 'bg-green-100 text-green-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-red-100 text-red-800'
  };
  const labels = { low: 'Låg', medium: 'Medel', high: 'Hög' };
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[level]}`}>
      {labels[level]}
    </span>
  );
};

export default function AssessmentForm({ user, onSuccess }) {
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      worker_name: user?.name || '',
      risk_s: 1,
      risk_k: 1,
      safe: 'Ja',
      further: 'Nej',
      fullrisk: 'Nej'
    }
  });

  const [checklist, setChecklist] = useState(Array(SAFETY_QUESTIONS.length).fill(''));
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: submitAssessment,
    onSuccess: (data) => {
      queryClient.invalidateQueries(['assessments']);
      onSuccess?.(data);
    }
  });

  const watchedValues = watch(['risk_s', 'risk_k']);
  const riskScore = (watchedValues[0] || 1) * (watchedValues[1] || 1);
  const hasNegativeAnswers = checklist.some(answer => answer === 'Nej');
  const requiresLeaderApproval = riskScore >= 10 || hasNegativeAnswers || watch('safe') === 'Nej';

  const onSubmit = (data) => {
    mutation.mutate({
      ...data,
      checklist,
      risk_score: riskScore
    });
  };

  const updateChecklist = (index, value) => {
    const newChecklist = [...checklist];
    newChecklist[index] = value;
    setChecklist(newChecklist);
  };

  return (
    <div className="bg-white shadow-lg rounded-lg p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Ny riskbedömning</h2>
        <RiskBadge score={riskScore} />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Datum *
            </label>
            <input
              type="date"
              {...register('date', { required: 'Datum krävs' })}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
            {errors.date && <p className="text-red-500 text-xs mt-1">{errors.date.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Namn *
            </label>
            <input
              type="text"
              {...register('worker_name', { required: 'Namn krävs' })}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
            {errors.worker_name && <p className="text-red-500 text-xs mt-1">{errors.worker_name.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Team
            </label>
            <input
              type="text"
              {...register('team')}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Plats
            </label>
            <input
              type="text"
              {...register('location')}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Arbetsuppgift *
          </label>
          <input
            type="text"
            {...register('task', { required: 'Arbetsuppgift krävs' })}
            placeholder="Kort beskrivning av arbetsuppgiften"
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          />
          {errors.task && <p className="text-red-500 text-xs mt-1">{errors.task.message}</p>}
        </div>

        {/* Risk Assessment */}
        <div className="bg-gray-50 p-4 rounded-md">
          <h3 className="text-lg font-semibold mb-4">Riskbedömning</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sannolikhet (1-5) *
              </label>
              <select
                {...register('risk_s', { required: true, min: 1, max: 5 })}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                {[1,2,3,4,5].map(i => (
                  <option key={i} value={i}>{i}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Konsekvens (1-5) *
              </label>
              <select
                {...register('risk_k', { required: true, min: 1, max: 5 })}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                {[1,2,3,4,5].map(i => (
                  <option key={i} value={i}>{i}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Riskpoäng
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={riskScore}
                  readOnly
                  className="w-16 p-2 border border-gray-300 rounded-md bg-gray-100"
                />
                <RiskBadge score={riskScore} />
              </div>
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Identifierade risker
            </label>
            <textarea
              {...register('risks')}
              rows={3}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              placeholder="Beskriv identifierade risker..."
            />
          </div>
        </div>

        {/* Safety Checklist */}
        <div className="bg-gray-50 p-4 rounded-md">
          <h3 className="text-lg font-semibold mb-4">Säkerhetschecklista</h3>
          <div className="space-y-3">
            {SAFETY_QUESTIONS.map((question, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-white rounded border">
                <span className="text-sm font-medium text-gray-700 flex-1">
                  {index + 1}. {question}
                </span>
                <div className="flex space-x-2 ml-4">
                  {['', 'Ja', 'Nej'].map(option => (
                    <label key={option} className="flex items-center">
                      <input
                        type="radio"
                        name={`checklist_${index}`}
                        value={option}
                        checked={checklist[index] === option}
                        onChange={(e) => updateChecklist(index, e.target.value)}
                        className="mr-1"
                      />
                      <span className="text-sm">{option || '-'}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {hasNegativeAnswers && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-start">
              <AlertTriangle className="h-5 w-5 text-red-400 mt-0.5 mr-2 flex-shrink-0" />
              <p className="text-sm text-red-700">
                Minst ett svar är "Nej" – kräver arbetsledarens godkännande.
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Åtgärder
          </label>
          <textarea
            {...register('actions')}
            rows={3}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            placeholder="Spärra av, LOTO, skyltning, fallskydd, mät/ventilera..."
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Behövs ytterligare åtgärder?
            </label>
            <select
              {...register('further')}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            >
              <option value="Nej">Nej</option>
              <option value="Ja">Ja</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Behövs full riskanalys framåt?
            </label>
            <select
              {...register('fullrisk')}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            >
              <option value="Nej">Nej</option>
              <option value="Ja">Ja</option>
            </select>
          </div>
        </div>

        {/* Approval Section */}
        {requiresLeaderApproval && (
          <div className="bg-yellow-50 p-4 rounded-md border border-yellow-200">
            <h3 className="text-lg font-semibold mb-4 text-yellow-800">Godkännande krävs</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kan arbetet utföras säkert? *
                </label>
                <select
                  {...register('safe', { required: requiresLeaderApproval })}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                >
                  <option value="Ja">Ja</option>
                  <option value="Nej">Nej</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Arbetsledare *
                </label>
                <input
                  type="text"
                  {...register('leader', { required: requiresLeaderApproval ? 'Arbetsledare krävs' : false })}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
                {errors.leader && <p className="text-red-500 text-xs mt-1">{errors.leader.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Signatur/Initialer *
                </label>
                <input
                  type="text"
                  {...register('signature', { required: requiresLeaderApproval ? 'Signatur krävs' : false })}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
                {errors.signature && <p className="text-red-500 text-xs mt-1">{errors.signature.message}</p>}
              </div>
            </div>
          </div>
        )}

        {/* Submit */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div>
            {mutation.error && (
              <p className="text-red-500 text-sm">
                {mutation.error.message || 'Ett fel uppstod'}
              </p>
            )}
            {mutation.isSuccess && (
              <div className="flex items-center text-green-600 text-sm">
                <CheckCircle className="h-4 w-4 mr-1" />
                Bedömning skickad!
              </div>
            )}
          </div>
          
          <button
            type="submit"
            disabled={mutation.isPending}
            className="bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-md font-medium transition-colors"
          >
            {mutation.isPending ? 'Skickar...' : 'Skicka bedömning'}
          </button>
        </div>
      </form>
    </div>
  );
}