<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Student;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class PhotoController extends Controller
{
    /** Private photo delivery: only the owner or staff may fetch it. */
    public function show(int $id): StreamedResponse
    {
        $student = Student::withTrashed()->findOrFail($id);
        $this->authorize('view', $student);

        $disk = Storage::disk(config('digitalid.photo.disk'));
        abort_unless($student->photo_path && $disk->exists($student->photo_path), 404);

        return $disk->response($student->photo_path, null, [
            'Cache-Control' => 'private, max-age=300',
            'X-Content-Type-Options' => 'nosniff',
        ]);
    }
}
