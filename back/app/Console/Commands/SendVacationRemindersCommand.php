<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Vacacion;
use App\Models\User;
use App\Mail\VacationReminderMail;
use Illuminate\Support\Facades\Mail;
use Carbon\Carbon;

class SendVacationRemindersCommand extends Command
{
    protected $signature = 'vacations:reminders';
    protected $description = 'Send automated reminders for upcoming approved vacations';

    public function handle()
    {
        $this->info('Checking for upcoming vacations...');
        
        $today = Carbon::today();
        
        // Buscamos vacaciones aprobadas
        $vacaciones = Vacacion::where('estado', 'aprobada')->with('user')->get();
        $admins = User::whereIn('rol', ['super_admin', 'admin'])->get();

        foreach ($vacaciones as $vac) {
            $inicio = Carbon::parse($vac->fecha_inicio);
            $aviso = null;

            if ($inicio->copy()->subMonth()->isToday()) {
                $aviso = 'Falta 1 mes';
            } elseif ($inicio->copy()->subWeek()->isToday()) {
                $aviso = 'Falta 1 semana';
            } elseif ($inicio->copy()->startOfWeek()->isSameDay($today->copy()->startOfWeek())) {
                // Solo enviar el correo de "esta semana" el lunes de esa semana
                if ($today->isMonday()) {
                    $aviso = 'Esta semana';
                }
            }

            if ($aviso) {
                foreach ($admins as $admin) {
                    try {
                        Mail::to($admin->email)->send(new VacationReminderMail($vac, $vac->user, $aviso));
                    } catch (\Exception $e) {
                        \Illuminate\Support\Facades\Log::error("Error enviando recordatorio ($aviso): " . $e->getMessage());
                    }
                }
                $this->info("Recordatorio '$aviso' enviado para " . $vac->user->nombre);
            }
        }
        
        $this->info('Vacation reminders checked.');
    }
}
