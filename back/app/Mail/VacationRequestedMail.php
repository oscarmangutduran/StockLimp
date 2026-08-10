<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class VacationRequestedMail extends Mailable
{
    use Queueable, SerializesModels;

    public $vacacion;
    public $userSolicitante;

    public function __construct($vacacion, $userSolicitante)
    {
        $this->vacacion = $vacacion;
        $this->userSolicitante = $userSolicitante;
    }

    public function build()
    {
        return $this->subject('Nueva Solicitud de Vacaciones - ' . $this->userSolicitante->nombre)
            ->html('
                <h2>Nueva solicitud de vacaciones</h2>
                <p>El empleado <strong>' . $this->userSolicitante->nombre . '</strong> ha solicitado vacaciones.</p>
                <ul>
                    <li><strong>Desde:</strong> ' . $this->vacacion->fecha_inicio . '</li>
                    <li><strong>Hasta:</strong> ' . $this->vacacion->fecha_fin . '</li>
                    <li><strong>Comentarios:</strong> ' . ($this->vacacion->comentarios ?: 'Ninguno') . '</li>
                </ul>
                <p>Por favor, revisa el panel de administración para aprobar o rechazar la solicitud.</p>
            ');
    }
}
