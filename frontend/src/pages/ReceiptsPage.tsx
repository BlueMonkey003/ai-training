import { useEffect, useState } from 'react';
import { receiptApi, API_URL } from '../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';

export default function ReceiptsPage() {
    const [from, setFrom] = useState('');
    const [to, setTo] = useState('');
    const [allReceipts, setAllReceipts] = useState<any[]>([]);
    const [allTotal, setAllTotal] = useState(0);
    const [detailsReceipts, setDetailsReceipts] = useState<any[]>([]);
    const [selectedRestaurantId, setSelectedRestaurantId] = useState<string | null>(null);
    const [selectedParticipantId, setSelectedParticipantId] = useState<string | null>(null);
    const [summary, setSummary] = useState<any>({ overall: [], byRestaurant: [], byUser: [] });
    const [loading, setLoading] = useState(false);

    const load = async () => {
        setLoading(true);
        try {
            const [listRes, sumRes] = await Promise.all([
                receiptApi.list({ from, to, page: 1, pageSize: 25 }),
                receiptApi.summary({ from, to }),
            ]);
            setAllReceipts(listRes.receipts);
            setAllTotal(listRes.total);
            setSummary(sumRes.summary || { overall: [], byRestaurant: [], byUser: [] });
            setSelectedRestaurantId(null);
            setSelectedParticipantId(null);
            setDetailsReceipts([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const overallTotal = summary.overall?.[0]?.totalAmount || 0;

    const handleDownload = async (id: string) => {
        try {
            const res = await fetch(`${API_URL}/api/receipts/${id}/download`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` },
            });
            if (!res.ok) throw new Error('Download mislukt');
            const blob = await res.blob();
            let filename = 'bonnetje';
            const disposition = res.headers.get('content-disposition') || '';
            const match = disposition.match(/filename\*?=([^;]+)|filename="?([^";]+)"?/i);
            if (match) {
                filename = decodeURIComponent((match[1] || match[2] || filename).replace(/^UTF-8''/, '').trim());
            }
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6 px-4 sm:px-0">
            <div className="flex items-end gap-3 flex-wrap">
                <div>
                    <label className="block text-sm text-gray-600">Van</label>
                    <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
                </div>
                <div>
                    <label className="block text-sm text-gray-600">Tot</label>
                    <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
                </div>
                <button
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    onClick={load}
                    disabled={loading}
                >
                    {loading ? 'Laden...' : 'Filteren'}
                </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Totaal uitgaven</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-semibold">€ {overallTotal.toFixed(2)}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Aantal bonnetjes</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-semibold">{allTotal}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Sectie boven de algemene bonnetjes */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Per restaurant</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {(summary.byRestaurant || []).map((r: any, idx: number) => (
                                <div
                                    key={idx}
                                    className="border rounded-lg overflow-hidden bg-white cursor-pointer hover:shadow"
                                    onClick={async () => {
                                        setLoading(true);
                                        try {
                                            setSelectedRestaurantId(r._id);
                                            setSelectedParticipantId(null);
                                            const res = await fetch(`${API_URL}/api/receipts?restaurantId=${r._id}&includeTotals=true&page=1&pageSize=50`, {
                                                headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` },
                                            });
                                            const data = await res.json();
                                            setDetailsReceipts(data.receipts || []);
                                        } finally {
                                            setLoading(false);
                                        }
                                    }}
                                >
                                    <div className="aspect-video bg-gray-100">
                                        {r.imageUrl ? (
                                            <img src={r.imageUrl} alt={r.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-400">Geen afbeelding</div>
                                        )}
                                    </div>
                                    <div className="p-3">
                                        <div className="font-medium">{r.name || r._id}</div>
                                        <div className="text-sm text-gray-600">Aantal: {r.count}</div>
                                        <div className="text-sm text-gray-600">Totaal: € {(r.totalAmount || 0).toFixed(2)}</div>
                                        <div className="mt-2 text-blue-600 text-sm">Klik voor details</div>
                                    </div>
                                </div>
                            ))}
                            {((summary.byRestaurant || []).length === 0) && (
                                <div className="text-gray-500">Nog geen data</div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Per persoon</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {(summary.byUser || []).map((u: any, idx: number) => (
                                <div key={idx} className="border rounded-lg p-3 bg-white cursor-pointer hover:shadow" onClick={async () => {
                                    setLoading(true);
                                    try {
                                        setSelectedParticipantId(u._id);
                                        setSelectedRestaurantId(null);
                                        const res = await fetch(`${API_URL}/api/receipts?participantId=${u._id}&includeTotals=true&page=1&pageSize=50`, {
                                            headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` },
                                        });
                                        const data = await res.json();
                                        setDetailsReceipts(data.receipts || []);
                                    } finally {
                                        setLoading(false);
                                    }
                                }}>
                                    <div className="flex items-center gap-3">
                                        {u.profileImageUrl ? (
                                            <img src={u.profileImageUrl} alt={u.name} className="w-10 h-10 rounded-full object-cover" />
                                        ) : (
                                            <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-sm">
                                                {(u.name || '?').toString().charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                        <div>
                                            <div className="font-medium">{u.name || u._id}</div>
                                            <div className="text-sm text-gray-600">Bestellingen: {u.count} • Totaal: € {(u.totalAmount || 0).toFixed(2)}</div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
                {selectedRestaurantId && detailsReceipts.length > 0 && (
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle>Details geselecteerd restaurant</CardTitle>
                                <button className="text-sm text-blue-600 hover:underline" onClick={() => { setSelectedRestaurantId(null); setDetailsReceipts([]); }}>
                                    Wis selectie
                                </button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {/* Desktop/Tablet tabel */}
                            <div className="hidden sm:block overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="text-left text-gray-600">
                                            <th className="py-2">Datum</th>
                                            <th className="py-2">Restaurant</th>
                                            <th className="py-2">Deelnemers</th>
                                            <th className="py-2">Totaal</th>
                                            <th className="py-2">Beoordeling</th>
                                            <th className="py-2">Download</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {detailsReceipts.map((r) => (
                                            <tr key={r._id} className="border-t">
                                                <td className="py-2">{new Date(r.createdAt).toLocaleDateString('nl-NL')}</td>
                                                <td className="py-2">{r.restaurant?.name || (r.restaurantId as any)?.name || '-'}</td>
                                                <td className="py-2">
                                                    <div className="flex -space-x-2 flex-wrap gap-1">
                                                        {(r.participants || []).map((p: any) => (
                                                            <img key={p._id} title={p.name || p.email} src={p.profileImageUrl || ''} alt={p.name} className="w-6 h-6 rounded-full object-cover border bg-gray-200" />
                                                        ))}
                                                    </div>
                                                </td>
                                                <td className="py-2">{typeof r.orderTotal === 'number' ? `€ ${r.orderTotal.toFixed(2)}` : '-'}</td>
                                                <td className="py-2">{typeof r.rating === 'number' ? `${r.rating}/5` : '-'}</td>
                                                <td className="py-2"><a className="text-blue-600 hover:underline" href="#" onClick={(e) => { e.preventDefault(); handleDownload(r._id); }}>Download</a></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            {/* Mobiel kaarten */}
                            <div className="sm:hidden space-y-3">
                                {detailsReceipts.map((r) => (
                                    <div key={r._id} className="border rounded-lg p-3 bg-white">
                                        <div className="text-sm text-gray-600">{new Date(r.createdAt).toLocaleDateString('nl-NL')}</div>
                                        <div className="font-medium">{r.restaurant?.name || (r.restaurantId as any)?.name || '-'}</div>
                                        <div className="mt-2 flex -space-x-2 flex-wrap gap-1">
                                            {(r.participants || []).map((p: any) => (
                                                <img key={p._id} title={p.name || p.email} src={p.profileImageUrl || ''} alt={p.name} className="w-6 h-6 rounded-full object-cover border bg-gray-200" />
                                            ))}
                                        </div>
                                        <div className="mt-1 text-sm">Totaal: {typeof r.orderTotal === 'number' ? `€ ${r.orderTotal.toFixed(2)}` : '-'}</div>
                                        <div className="mt-1 text-sm">Beoordeling: {typeof r.rating === 'number' ? `${r.rating}/5` : '-'}</div>
                                        <div className="mt-2"><a className="text-blue-600 hover:underline" href="#" onClick={(e) => { e.preventDefault(); handleDownload(r._id); }}>Download</a></div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}
                {selectedParticipantId && detailsReceipts.length > 0 && (
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle>Details geselecteerde persoon</CardTitle>
                                <button className="text-sm text-blue-600 hover:underline" onClick={() => { setSelectedParticipantId(null); setDetailsReceipts([]); }}>
                                    Wis selectie
                                </button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {/* Desktop/Tablet tabel */}
                            <div className="hidden sm:block overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="text-left text-gray-600">
                                            <th className="py-2">Datum</th>
                                            <th className="py-2">Restaurant</th>
                                            <th className="py-2">Deelnemers</th>
                                            <th className="py-2">Individueel</th>
                                            <th className="py-2">Totaal</th>
                                            <th className="py-2">Download</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {detailsReceipts.map((r) => (
                                            <tr key={r._id} className="border-t">
                                                <td className="py-2">{new Date(r.createdAt).toLocaleDateString('nl-NL')}</td>
                                                <td className="py-2">{r.restaurant?.name || (r.restaurantId as any)?.name || '-'}</td>
                                                <td className="py-2">
                                                    <div className="flex -space-x-2 flex-wrap gap-1">
                                                        {(r.participants || []).map((p: any) => (
                                                            <img key={p._id} title={p.name || p.email} src={p.profileImageUrl || ''} alt={p.name} className="w-6 h-6 rounded-full object-cover border bg-gray-200" />
                                                        ))}
                                                    </div>
                                                </td>
                                                <td className="py-2">{typeof r.participantTotal === 'number' ? `€ ${r.participantTotal.toFixed(2)}` : '-'}</td>
                                                <td className="py-2">{typeof r.orderTotal === 'number' ? `€ ${r.orderTotal.toFixed(2)}` : '-'}</td>
                                                <td className="py-2"><a className="text-blue-600 hover:underline" href="#" onClick={(e) => { e.preventDefault(); handleDownload(r._id); }}>Download</a></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            {/* Mobiel kaarten */}
                            <div className="sm:hidden space-y-3">
                                {detailsReceipts.map((r) => (
                                    <div key={r._id} className="border rounded-lg p-3 bg-white">
                                        <div className="text-sm text-gray-600">{new Date(r.createdAt).toLocaleDateString('nl-NL')}</div>
                                        <div className="font-medium">{r.restaurant?.name || (r.restaurantId as any)?.name || '-'}</div>
                                        <div className="mt-2 flex -space-x-2 flex-wrap gap-1">
                                            {(r.participants || []).map((p: any) => (
                                                <img key={p._id} title={p.name || p.email} src={p.profileImageUrl || ''} alt={p.name} className="w-6 h-6 rounded-full object-cover border bg-gray-200" />
                                            ))}
                                        </div>
                                        <div className="mt-1 text-sm">Individueel: {typeof r.participantTotal === 'number' ? `€ ${r.participantTotal.toFixed(2)}` : '-'}</div>
                                        <div className="mt-1 text-sm">Totaal: {typeof r.orderTotal === 'number' ? `€ ${r.orderTotal.toFixed(2)}` : '-'}</div>
                                        <div className="mt-2"><a className="text-blue-600 hover:underline" href="#" onClick={(e) => { e.preventDefault(); handleDownload(r._id); }}>Download</a></div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Verplaatst naar onder: Algemeen Bonnetjes-overzicht */}
            <Card>
                <CardHeader>
                    <CardTitle>Bonnetjes</CardTitle>
                </CardHeader>
                <CardContent>
                    {/* Desktop/Tablet tabel */}
                    <div className="hidden sm:block overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-left text-gray-600">
                                    <th className="py-2">Datum</th>
                                    <th className="py-2">Order</th>
                                    <th className="py-2">Restaurant</th>
                                    <th className="py-2">Geüpload door</th>
                                    <th className="py-2">Totaal</th>
                                    <th className="py-2">Download</th>
                                </tr>
                            </thead>
                            <tbody>
                                {allReceipts.map((r) => (
                                    <tr key={r._id} className="border-t">
                                        <td className="py-2">{new Date(r.createdAt).toLocaleDateString('nl-NL')}</td>
                                        <td className="py-2">{r.orderId || '-'}</td>
                                        <td className="py-2">{(r.restaurantId as any)?.name || '-'}</td>
                                        <td className="py-2">
                                            <div className="flex items-center gap-2">
                                                {(r.uploadedBy as any)?.profileImageUrl ? (
                                                    <img src={(r.uploadedBy as any).profileImageUrl} alt={(r.uploadedBy as any).name} className="w-6 h-6 rounded-full object-cover" />
                                                ) : (
                                                    <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center text-xs">
                                                        {((r.uploadedBy as any)?.name || (r.uploadedBy as any)?.email || '?').toString().charAt(0).toUpperCase()}
                                                    </div>
                                                )}
                                                <span>{(r.uploadedBy as any)?.name || (r.uploadedBy as any)?.email || '-'}</span>
                                            </div>
                                        </td>
                                        <td className="py-2">{typeof r.orderTotal === 'number' ? `€ ${r.orderTotal.toFixed(2)}` : '-'}</td>
                                        <td className="py-2">
                                            <a
                                                className="text-blue-600 hover:underline"
                                                href="#"
                                                onClick={(e) => { e.preventDefault(); handleDownload(r._id); }}
                                            >
                                                Download
                                            </a>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobiele kaart-weergave */}
                    <div className="sm:hidden space-y-3">
                        {allReceipts.map((r) => (
                            <div key={r._id} className="border rounded-lg p-3 bg-white">
                                <div className="text-sm text-gray-600">{new Date(r.createdAt).toLocaleDateString('nl-NL')}</div>
                                <div className="font-medium">{(r.restaurantId as any)?.name || '-'}</div>
                                <div className="flex items-center gap-2 mt-1">
                                    {(r.uploadedBy as any)?.profileImageUrl ? (
                                        <img src={(r.uploadedBy as any).profileImageUrl} alt={(r.uploadedBy as any).name} className="w-6 h-6 rounded-full object-cover" />
                                    ) : (
                                        <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center text-xs">
                                            {((r.uploadedBy as any)?.name || (r.uploadedBy as any)?.email || '?').toString().charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                    <span className="text-sm">{(r.uploadedBy as any)?.name || (r.uploadedBy as any)?.email || '-'}</span>
                                </div>
                                <div className="mt-1 text-sm">Totaal: {typeof r.orderTotal === 'number' ? `€ ${r.orderTotal.toFixed(2)}` : '-'}</div>
                                <div className="mt-2">
                                    <a className="text-blue-600 hover:underline" href="#" onClick={(e) => { e.preventDefault(); handleDownload(r._id); }}>Download</a>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Globale detailsectie verwijderd; details staan bij de secties zelf */}

            {/* Top 5 blokken tonen, ook bij weinig data */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Top 5 restaurants (aantal)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-2 text-sm">
                            {(summary.byRestaurant || []).slice().sort((a: any, b: any) => (b.count || 0) - (a.count || 0)).slice(0, 5).map((r: any, idx: number) => (
                                <li key={idx} className="flex justify-between">
                                    <span>{r.name || r._id || '—'}</span>
                                    <span className="text-gray-600">{r.count || 0}</span>
                                </li>
                            ))}
                            {((summary.byRestaurant || []).length === 0) && (
                                <li className="text-gray-500">Nog geen data</li>
                            )}
                        </ul>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Top 5 gebruikers (totaal €)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-2 text-sm">
                            {(summary.byUser || []).slice().sort((a: any, b: any) => (b.totalAmount || 0) - (a.totalAmount || 0)).slice(0, 5).map((u: any, idx: number) => (
                                <li key={idx} className="flex justify-between">
                                    <span>{u.name || u._id || '—'}</span>
                                    <span className="text-gray-600">€ {(u.totalAmount || 0).toFixed(2)}</span>
                                </li>
                            ))}
                            {((summary.byUser || []).length === 0) && (
                                <li className="text-gray-500">Nog geen data</li>
                            )}
                        </ul>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}


