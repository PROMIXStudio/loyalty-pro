<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\Firebase\FirestoreService;

class InitFirestore extends Command
{
    protected $signature = 'firestore:init';

    protected $description = 'Initialize Firestore structure';

    public function handle()
    {
        $firestore = new FirestoreService();

        $db = $firestore->db();

        $collections = [
            'admins',
            'owners',
            'shops',
            'shop_users',
            'customers',
            'subscriptions',
            'transactions',
            'notifications',
            'products',
            'sales',
            'rewards',
            'settings',
            'activity_logs'
        ];

        foreach ($collections as $collection) {

            $db->collection($collection)
                ->add([
                    'test' => true,
                    'created_at' => now()->toDateTimeString()
                ]);

            $this->info("Collection {$collection} initialized.");
        }

        /*
        |--------------------------------------------------------------------------
        | CREATE TEST OWNER
        |--------------------------------------------------------------------------
        */

        $owner = $db->collection('owners')->add([
            'name' => 'Jean',
            'email' => 'jean@gmail.com',
            'created_at' => now()->toDateTimeString()
        ]);

        $ownerId = $owner->id();

        /*
        |--------------------------------------------------------------------------
        | CREATE SHOP
        |--------------------------------------------------------------------------
        */

        $shop = $db->collection('shops')->add([
            'owner_id' => $ownerId,
            'shop_name' => 'MPH_SHOP',
            'domain' => 'restaurant',
            'amount_step' => 500,
            'points_per_step' => 5,
            'status' => 'active',
            'subscription_started_at' => now()->toDateTimeString(),
            'subscription_ends_at' => now()->addMinutes(5)->toDateTimeString(),
            'created_at' => now()->toDateTimeString()
        ]);

        $shopId = $shop->id();

        /*
        |--------------------------------------------------------------------------
        | CREATE TEST CUSTOMER
        |--------------------------------------------------------------------------
        */

        $db->collection('customers')->add([
            'shop_id' => $shopId,
            'name' => 'Client Test',
            'phone' => '670000000',
            'points' => 0,
            'qr_code' => 'CLIENT001|'.$shopId,
            'created_at' => now()->toDateTimeString()
        ]);

        $this->info('Firestore fully initialized.');
    }
}
