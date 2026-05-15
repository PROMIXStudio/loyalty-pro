<?php

namespace App\Services\Firebase;

use Kreait\Firebase\Factory;

class FirestoreService
{
    protected $firestore;

    public function __construct()
    {
        $factory = (new Factory)
            ->withServiceAccount(
                storage_path('app/firebase/firebase.json')
            );

        $this->firestore = $factory
            ->createFirestore()
            ->database();
    }

    public function db()
    {
        return $this->firestore;
    }
}
