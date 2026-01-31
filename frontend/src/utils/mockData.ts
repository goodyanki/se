export interface Item {
    id: string;
    title: string;
    price: number;
    description: string;
    category: string;
    image: string;
    seller: string;
    sellerAddress: string;
    status: 'AVAILABLE' | 'SOLD' | 'PENDING';
    createdAt: string;
}

export const CATEGORIES = ['All', 'Books', 'Electronics', 'Furniture', 'Others'];

const SELLERS = [
    { name: 'Student_A', addr: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F' },
    { name: 'Student_B', addr: '0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199' },
    { name: 'Student_C', addr: '0xdD2FD4581271e230360230F9337D5c0430Bf4EE5' },
];

export const MOCK_ITEMS: Item[] = [
    {
        id: '1',
        title: 'Introduction to Algorithms (CLRS)',
        price: 45,
        description: 'Used condition, minor highlighting. Essential for CS students.',
        category: 'Books',
        image: 'https://placehold.co/400x300?text=Algorithms+Book',
        seller: 'Student_A',
        sellerAddress: SELLERS[0].addr,
        status: 'AVAILABLE',
        createdAt: '2023-10-25T10:00:00Z'
    },
    {
        id: '2',
        title: 'iPad Air 4th Gen',
        price: 450,
        description: 'Space Gray, 64GB. Comes with Apple Pencil 2.',
        category: 'Electronics',
        image: 'https://placehold.co/400x300?text=iPad+Air',
        seller: 'Student_B',
        sellerAddress: SELLERS[1].addr,
        status: 'AVAILABLE',
        createdAt: '2023-10-24T14:30:00Z'
    },
    {
        id: '3',
        title: 'Office Chair',
        price: 30,
        description: 'Comfortable mesh chair, slightly worn.',
        category: 'Furniture',
        image: 'https://placehold.co/400x300?text=Office+Chair',
        seller: 'Student_C',
        sellerAddress: SELLERS[2].addr,
        status: 'SOLD',
        createdAt: '2023-10-20T09:00:00Z'
    },
    {
        id: '4',
        title: 'Sony WH-1000XM4',
        price: 200,
        description: 'Noise cancelling headphones. Great battery life.',
        category: 'Electronics',
        image: 'https://placehold.co/400x300?text=Headphones',
        seller: 'Student_A',
        sellerAddress: SELLERS[0].addr,
        status: 'AVAILABLE',
        createdAt: '2023-10-26T11:20:00Z'
    },
    {
        id: '5',
        title: 'Calculus: Early Transcendentals',
        price: 50,
        description: 'Hardcover, 8th Edition. Like new.',
        category: 'Books',
        image: 'https://placehold.co/400x300?text=Calculus+Book',
        seller: 'Student_B',
        sellerAddress: SELLERS[1].addr,
        status: 'AVAILABLE',
        createdAt: '2023-10-27T08:00:00Z'
    },
    {
        id: '6',
        title: 'Logitech MX Master 3S',
        price: 80,
        description: 'Ergonomic mouse, perfect for productivity.',
        category: 'Electronics',
        image: 'https://placehold.co/400x300?text=Mouse',
        seller: 'Student_C',
        sellerAddress: SELLERS[2].addr,
        status: 'AVAILABLE',
        createdAt: '2023-10-27T09:15:00Z'
    },
    {
        id: '7',
        title: 'Dorm Mini Fridge',
        price: 60,
        description: 'Works perfectly, moving out sale.',
        category: 'Furniture',
        image: 'https://placehold.co/400x300?text=Fridge',
        seller: 'Student_A',
        sellerAddress: SELLERS[0].addr,
        status: 'PENDING',
        createdAt: '2023-10-28T12:00:00Z'
    },
    {
        id: '8',
        title: 'Mechanical Keyboard (Keychron K2)',
        price: 70,
        description: 'Brown switches, RGB backlight.',
        category: 'Electronics',
        image: 'https://placehold.co/400x300?text=Keyboard',
        seller: 'Student_B',
        sellerAddress: SELLERS[1].addr,
        status: 'AVAILABLE',
        createdAt: '2023-10-28T14:00:00Z'
    },
    {
        id: '9',
        title: 'Study Desk Lamp',
        price: 15,
        description: 'LED lamp with adjustable brightness.',
        category: 'Furniture',
        image: 'https://placehold.co/400x300?text=Lamp',
        seller: 'Student_C',
        sellerAddress: SELLERS[2].addr,
        status: 'AVAILABLE',
        createdAt: '2023-10-29T10:00:00Z'
    },
    {
        id: '10',
        title: 'Scientific Calculator fx-991EX',
        price: 25,
        description: 'Approved for exams. Good condition.',
        category: 'Others',
        image: 'https://placehold.co/400x300?text=Calculator',
        seller: 'Student_A',
        sellerAddress: SELLERS[0].addr,
        status: 'AVAILABLE',
        createdAt: '2023-10-29T11:30:00Z'
    },
    {
        id: '11',
        title: 'Electric Kettle',
        price: 12,
        description: '1.7L capacity, fast boiling.',
        category: 'Others',
        image: 'https://placehold.co/400x300?text=Kettle',
        seller: 'Student_B',
        sellerAddress: SELLERS[1].addr,
        status: 'AVAILABLE',
        createdAt: '2023-10-30T09:00:00Z'
    },
    {
        id: '12',
        title: 'Clean Code by Robert Martin',
        price: 35,
        description: 'A Handbook of Agile Software Craftsmanship.',
        category: 'Books',
        image: 'https://placehold.co/400x300?text=Clean+Code',
        seller: 'Student_C',
        sellerAddress: SELLERS[2].addr,
        status: 'AVAILABLE',
        createdAt: '2023-10-30T13:45:00Z'
    },
    {
        id: '13',
        title: 'Gaming Monitor 24"',
        price: 120,
        description: '144Hz, 1ms response time. ASUS.',
        category: 'Electronics',
        image: 'https://placehold.co/400x300?text=Monitor',
        seller: 'Student_A',
        sellerAddress: SELLERS[0].addr,
        status: 'AVAILABLE',
        createdAt: '2023-10-31T10:00:00Z'
    },
    {
        id: '14',
        title: 'Bookshelf 3-Tier',
        price: 25,
        description: 'Wooden bookshelf, easy to assemble.',
        category: 'Furniture',
        image: 'https://placehold.co/400x300?text=Bookshelf',
        seller: 'Student_B',
        sellerAddress: SELLERS[1].addr,
        status: 'AVAILABLE',
        createdAt: '2023-10-31T15:20:00Z'
    },
    {
        id: '15',
        title: 'Bluetooth Speaker (JBL Clip)',
        price: 40,
        description: 'Portable, waterproof. Good bass.',
        category: 'Electronics',
        image: 'https://placehold.co/400x300?text=Speaker',
        seller: 'Student_C',
        sellerAddress: SELLERS[2].addr,
        status: 'AVAILABLE',
        createdAt: '2023-11-01T09:00:00Z'
    },
    {
        id: '16',
        title: 'Physics for Scientists/Engineers',
        price: 55,
        description: 'Vol 1 & 2. Heavy usage but intact.',
        category: 'Books',
        image: 'https://placehold.co/400x300?text=Physics+Book',
        seller: 'Student_A',
        sellerAddress: SELLERS[0].addr,
        status: 'AVAILABLE',
        createdAt: '2023-11-01T11:00:00Z'
    },
    {
        id: '17',
        title: 'Nintendo Switch Lite',
        price: 150,
        description: 'Yellow. Comes with Animal Crossing.',
        category: 'Electronics',
        image: 'https://placehold.co/400x300?text=Switch',
        seller: 'Student_B',
        sellerAddress: SELLERS[1].addr,
        status: 'SOLD',
        createdAt: '2023-11-02T10:30:00Z'
    },
    {
        id: '18',
        title: 'Floor Lamp',
        price: 20,
        description: 'Modern design, black finish.',
        category: 'Furniture',
        image: 'https://placehold.co/400x300?text=Floor+Lamp',
        seller: 'Student_C',
        sellerAddress: SELLERS[2].addr,
        status: 'AVAILABLE',
        createdAt: '2023-11-02T14:45:00Z'
    },
    {
        id: '19',
        title: 'Wireless Charger',
        price: 15,
        description: 'Fast charging pad for iPhone/Android.',
        category: 'Electronics',
        image: 'https://placehold.co/400x300?text=Charger',
        seller: 'Student_A',
        sellerAddress: SELLERS[0].addr,
        status: 'AVAILABLE',
        createdAt: '2023-11-03T08:30:00Z'
    },
    {
        id: '20',
        title: 'Organic Chemistry Model Kit',
        price: 10,
        description: 'Missing one carbon atom, otherwise complete.',
        category: 'Others',
        image: 'https://placehold.co/400x300?text=Chem+Kit',
        seller: 'Student_B',
        sellerAddress: SELLERS[1].addr,
        status: 'AVAILABLE',
        createdAt: '2023-11-03T12:00:00Z'
    },
    {
        id: '21',
        title: 'Coffee Maker (Drip)',
        price: 18,
        description: 'Basic coffee maker. 12 cups.',
        category: 'Others',
        image: 'https://placehold.co/400x300?text=Coffee+Maker',
        seller: 'Student_C',
        sellerAddress: SELLERS[2].addr,
        status: 'AVAILABLE',
        createdAt: '2023-11-04T09:15:00Z'
    }
];
