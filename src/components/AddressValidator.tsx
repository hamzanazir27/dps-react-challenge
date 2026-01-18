import { useState, useEffect, useCallback, useRef } from 'react';

interface PostalCode {
	postalCode: string;
	name: string;
}

interface ValidationState {
	locality: string;
	postalCode: string;
	availablePostalCodes: PostalCode[];
	isLoadingLocality: boolean;
	isLoadingPostalCode: boolean;
	errorLocality: string;
	errorPostalCode: string;
	showDropdown: boolean;
}

const AddressValidator = () => {
	const [state, setState] = useState<ValidationState>({
		locality: '',
		postalCode: '',
		availablePostalCodes: [],
		isLoadingLocality: false,
		isLoadingPostalCode: false,
		errorLocality: '',
		errorPostalCode: '',
		showDropdown: false,
	});

	const lastFetchedLocalityRef = useRef<string>('');
	const lastFetchedPostalCodeRef = useRef<string>('');

	const useDebounce = (value: string, delay: number) => {
		const [debouncedValue, setDebouncedValue] = useState(value);

		useEffect(() => {
			const handler = setTimeout(() => {
				setDebouncedValue(value);
			}, delay);

			return () => {
				clearTimeout(handler);
			};
		}, [value, delay]);

		return debouncedValue;
	};

	const debouncedLocality = useDebounce(state.locality, 1000);
	const debouncedPostalCode = useDebounce(state.postalCode, 1000);

	const fetchPostalCodesByLocality = useCallback(async (locality: string) => {
		if (!locality.trim()) {
			setState(prev => ({
				...prev,
				availablePostalCodes: [],
				showDropdown: false,
				errorLocality: '',
			}));
			lastFetchedLocalityRef.current = '';
			return;
		}

		if (lastFetchedLocalityRef.current === locality) {
			return;
		}

		lastFetchedLocalityRef.current = locality;
		setState(prev => ({ ...prev, isLoadingLocality: true, errorLocality: '' }));

		try {
			const response = await fetch(
				`https://openplzapi.org/de/Localities?name=${encodeURIComponent(locality)}`
			);

			if (!response.ok) {
				throw new Error('Failed to fetch postal codes');
			}

			const data = await response.json();

			if (data.length === 0) {
				setState(prev => ({
					...prev,
					isLoadingLocality: false,
					errorLocality: 'No postal codes found for this locality',
					availablePostalCodes: [],
					showDropdown: false,
				}));
			} else if (data.length === 1) {
				lastFetchedPostalCodeRef.current = data[0].postalCode;
				setState(prev => ({
					...prev,
					isLoadingLocality: false,
					postalCode: data[0].postalCode,
					availablePostalCodes: [],
					showDropdown: false,
					errorLocality: '',
				}));
			} else {
				const postalCodes = data.map((item: any) => ({
					postalCode: item.postalCode,
					name: item.name,
				}));
				setState(prev => ({
					...prev,
					isLoadingLocality: false,
					availablePostalCodes: postalCodes,
					showDropdown: true,
					errorLocality: '',
				}));
			}
		} catch (error) {
			setState(prev => ({
				...prev,
				isLoadingLocality: false,
				errorLocality: 'Error fetching postal codes. Please try again.',
			}));
		}
	}, []);

	const fetchLocalityByPostalCode = useCallback(async (postalCode: string) => {
		if (!postalCode.trim()) {
			setState(prev => ({ ...prev, errorPostalCode: '' }));
			lastFetchedPostalCodeRef.current = '';
			return;
		}

		if (lastFetchedPostalCodeRef.current === postalCode) {
			return;
		}

		lastFetchedPostalCodeRef.current = postalCode;
		setState(prev => ({ ...prev, isLoadingPostalCode: true, errorPostalCode: '' }));

		try {
			const response = await fetch(
				`https://openplzapi.org/de/Localities?postalCode=${encodeURIComponent(postalCode)}`
			);

			if (!response.ok) {
				throw new Error('Failed to fetch locality');
			}

			const data = await response.json();

			if (data.length === 0) {
				setState(prev => ({
					...prev,
					isLoadingPostalCode: false,
					errorPostalCode: 'Invalid postal code',
					locality: '',
				}));
			} else {
				lastFetchedLocalityRef.current = data[0].name;
				setState(prev => ({
					...prev,
					isLoadingPostalCode: false,
					locality: data[0].name,
					errorPostalCode: '',
					showDropdown: false,
					availablePostalCodes: [],
				}));
			}
		} catch (error) {
			setState(prev => ({
				...prev,
				isLoadingPostalCode: false,
				errorPostalCode: 'Error validating postal code. Please try again.',
			}));
		}
	}, []);

	useEffect(() => {
		if (debouncedLocality && !state.isLoadingPostalCode) {
			fetchPostalCodesByLocality(debouncedLocality);
		}
	}, [debouncedLocality, fetchPostalCodesByLocality, state.isLoadingPostalCode]);

	useEffect(() => {
		if (debouncedPostalCode && !state.isLoadingLocality) {
			fetchLocalityByPostalCode(debouncedPostalCode);
		}
	}, [debouncedPostalCode, fetchLocalityByPostalCode, state.isLoadingLocality]);

	const handleLocalityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value;
		lastFetchedLocalityRef.current = '';
		setState(prev => ({
			...prev,
			locality: value,
			errorLocality: '',
		}));
	};

	const handlePostalCodeChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
		const value = e.target.value;
		lastFetchedPostalCodeRef.current = '';
		setState(prev => ({
			...prev,
			postalCode: value,
			errorPostalCode: '',
			showDropdown: false,
			availablePostalCodes: [],
		}));
	};

	const handleDropdownChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		const selectedPostalCode = e.target.value;
		lastFetchedPostalCodeRef.current = '';
		setState(prev => ({
			...prev,
			postalCode: selectedPostalCode,
			showDropdown: false,
			availablePostalCodes: [],
		}));
	};

	const handleReset = () => {
		lastFetchedLocalityRef.current = '';
		lastFetchedPostalCodeRef.current = '';
		setState({
			locality: '',
			postalCode: '',
			availablePostalCodes: [],
			isLoadingLocality: false,
			isLoadingPostalCode: false,
			errorLocality: '',
			errorPostalCode: '',
			showDropdown: false,
		});
	};

	return (
		<div className="min-h-screen bg-gray-900">
			<div className="max-w-4xl mx-auto px-4 py-12">
				<div className="text-center mb-12">
					<h1 className="text-4xl font-bold text-white mb-3">
						German Address Validator
					</h1>
					<p className="text-gray-400 text-lg">
						Validate German postal codes and localities
					</p>
				</div>

				<div className="bg-gray-800 rounded-lg shadow-2xl p-8 mb-8 border border-gray-700">
					<form onSubmit={(e) => e.preventDefault()} className="space-y-6">
						<div className="grid md:grid-cols-2 gap-6">
							<div className="space-y-2">
								<label htmlFor="locality" className="flex justify-between items-center text-sm font-semibold text-gray-200">
									<span>Locality</span>
									{state.isLoadingLocality && (
										<span className="text-xs text-gray-400">Searching...</span>
									)}
								</label>
								<input
									type="text"
									id="locality"
									value={state.locality}
									onChange={handleLocalityChange}
									placeholder="e.g., Berlin, München"
									disabled={state.isLoadingPostalCode}
									className="w-full px-4 py-3 bg-gray-700 border-2 border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
								/>
								{state.errorLocality && (
									<p className="text-sm text-red-400 bg-red-900/20 px-3 py-2 rounded border border-red-800">
										{state.errorLocality}
									</p>
								)}
							</div>

							<div className="space-y-2">
								<label htmlFor="postalCode" className="flex justify-between items-center text-sm font-semibold text-gray-200">
									<span>Postal Code</span>
									{state.isLoadingPostalCode && (
										<span className="text-xs text-gray-400">Validating...</span>
									)}
								</label>
								{state.showDropdown ? (
									<select
										id="postalCode"
										value={state.postalCode}
										onChange={handleDropdownChange}
										className="w-full px-4 py-3 bg-gray-700 border-2 border-gray-600 rounded-lg text-white focus:outline-none focus:border-gray-400 transition-colors"
									>
										<option value="">Select a postal code</option>
										{state.availablePostalCodes.map((pc) => (
											<option key={pc.postalCode} value={pc.postalCode}>
												{pc.postalCode} - {pc.name}
											</option>
										))}
									</select>
								) : (
									<input
										type="text"
										id="postalCode"
										value={state.postalCode}
										onChange={handlePostalCodeChange}
										placeholder="e.g., 10115, 80331"
										disabled={state.isLoadingLocality}
										className="w-full px-4 py-3 bg-gray-700 border-2 border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
									/>
								)}
								{state.errorPostalCode && (
									<p className="text-sm text-red-400 bg-red-900/20 px-3 py-2 rounded border border-red-800">
										{state.errorPostalCode}
									</p>
								)}
								{state.showDropdown && (
									<p className="text-sm text-blue-400 bg-blue-900/20 px-3 py-2 rounded border border-blue-800">
										Multiple postal codes found. Please select one.
									</p>
								)}
							</div>
						</div>

						{state.locality && state.postalCode && !state.errorLocality && !state.errorPostalCode && (
							<div className="bg-gray-700 border-2 border-gray-600 rounded-lg p-4">
								<p className="text-white font-semibold">Address Validated Successfully</p>
								<p className="text-gray-300 text-sm mt-1">
									{state.locality} • PLZ {state.postalCode}
								</p>
							</div>
						)}

						{(state.locality || state.postalCode) && (
							<button
								type="button"
								onClick={handleReset}
								className="w-full px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition-colors border border-gray-600"
							>
								Reset Form
							</button>
						)}
					</form>
				</div>

				<div className="grid md:grid-cols-3 gap-6">
					<div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700/50 hover:border-gray-600 transition-colors">
						<h3 className="text-white font-semibold mb-2 text-lg">Lookup by Locality</h3>
						<p className="text-gray-400 text-sm">Type a city name to find postal codes</p>
					</div>
					<div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700/50 hover:border-gray-600 transition-colors">
						<h3 className="text-white font-semibold mb-2 text-lg">Lookup by PLZ</h3>
						<p className="text-gray-400 text-sm">Enter a postal code to validate</p>
					</div>
					<div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700/50 hover:border-gray-600 transition-colors">
						<h3 className="text-white font-semibold mb-2 text-lg">Smart Debouncing</h3>
						<p className="text-gray-400 text-sm">1-second delay for optimal performance</p>
					</div>
				</div>
			</div>
		</div>
	);
};

export default AddressValidator;
