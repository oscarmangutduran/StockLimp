<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class VacationReminderMail extends Mailable
{
    use Queueable, SerializesModels;

    public $vacacion;
    public $userSolicitante;
    public $tipoAviso;

    public function __construct($vacacion, $userSolicitante, $tipoAviso)
    {
        $this->vacacion = $vacacion;
        $this->userSolicitante = $userSolicitante;
        $this->tipoAviso = $tipoAviso;
    }

    public function build()
    {
        return $this->subject('Recordatorio de Vacaciones (' . $this->tipoAviso . ') - ' . $this->userSolicitante->nombre)
            ->html('
                <h2>Recordatorio de Vacaciones: ' . $this->tipoAviso . '</h2>
                <p>Este es un aviso automático sobre las vacaciones de <strong>' . $this->userSolicitante->nombre . '</strong>.</p>
                <ul>
                    <li><strong>Desde:</strong> ' . $this->vacacion->fecha_inicio . '</li>
                    <li><strong>Hasta:</strong> ' . $this->vacacion->fecha_fin . '</li>
                </ul>
                <p>Las vacaciones ya están aprobadas y comenzarán pronto.</p>
            ');
    }
}
