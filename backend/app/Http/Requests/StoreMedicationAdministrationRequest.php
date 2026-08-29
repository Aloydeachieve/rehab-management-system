<?php

namespace App\Http\Requests;

use App\Models\PrescriptionItem;
use Illuminate\Foundation\Http\FormRequest;

class StoreMedicationAdministrationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Middleware handles RBAC authorization
    }

    public function rules(): array
    {
        return [
            'patient_id' => ['required', 'exists:patients,id'],
            'prescription_item_id' => ['required', 'exists:prescription_items,id'],
            'scheduled_at' => ['required', 'date'],
            'status' => ['required', 'in:scheduled,given,missed,refused,cancelled'],
            'notes' => ['nullable', 'string'],
        ];
    }

    public function withValidator($validator)
    {
        $validator->after(function ($validator) {
            $patientId = $this->input('patient_id');
            $itemId = $this->input('prescription_item_id');

            if ($patientId && $itemId) {
                $item = PrescriptionItem::with('prescription')->find($itemId);
                if ($item && $item->prescription && $item->prescription->patient_id != $patientId) {
                    $validator->errors()->add(
                        'prescription_item_id',
                        'The selected prescription item does not belong to the selected patient.'
                    );
                }
            }
        });
    }
}
