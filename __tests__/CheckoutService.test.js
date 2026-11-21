import { UserMother } from './builders/UserMother.js';
import { CarrinhoBuilder } from './builders/CarrinhoBuilder.js';
import { CheckoutService } from '../src/services/CheckoutService.js';
import { Item } from '../src/domain/Item.js';

describe('UserMother', () => {
    test('cria um usuario padrao', () => {
        const usuario = UserMother.umUsuarioPadrao();

        expect(usuario.tipo).toBe('PADRAO');
        expect(usuario.isPremium()).toBe(false);
    });

    test('cria um usuario premium', () => {
        const usuario = UserMother.umUsuarioPremium();

        expect(usuario.tipo).toBe('PREMIUM');
        expect(usuario.isPremium()).toBe(true);
    });
});

describe('CarrinhoBuilder', () => {
    test('permite criar carrinhos vazios e customizados', () => {
        const carrinhoPadrao = new CarrinhoBuilder().build();
        const usuarioPremium = UserMother.umUsuarioPremium();
        const carrinhoVazio = new CarrinhoBuilder()
            .comUser(usuarioPremium)
            .vazio()
            .build();

        expect(carrinhoPadrao.itens).toHaveLength(1);
        expect(carrinhoVazio.user).toBe(usuarioPremium);
        expect(carrinhoVazio.itens).toHaveLength(0);
    });
});

describe('quando o pagamento falha', () => {
    test('retorna null e nao chama repository nem email', async () => {
        // Arrange
        const carrinho = new CarrinhoBuilder()
            .comItens([new Item('Livro', 100)])
            .build();
        const gatewayStub = {
            cobrar: jest.fn().mockResolvedValue({ success: false })
        };
        const repositoryDummy = {
            salvar: jest.fn()
        };
        const emailDummy = {
            enviarEmail: jest.fn()
        };
        const checkoutService = new CheckoutService(
            gatewayStub,
            repositoryDummy,
            emailDummy
        );

        // Act
        const pedido = await checkoutService.processarPedido(
            carrinho,
            'cartao-invalido'
        );

        // Assert
        expect(pedido).toBeNull();
        expect(gatewayStub.cobrar).toHaveBeenCalledWith(
            100,
            'cartao-invalido'
        );
        expect(repositoryDummy.salvar).not.toHaveBeenCalled();
        expect(emailDummy.enviarEmail).not.toHaveBeenCalled();
    });
});

describe('quando um cliente Premium finaliza a compra', () => {
    test('aplica desconto e envia o email de confirmacao', async () => {
        // Arrange
        const usuarioPremium = UserMother.umUsuarioPremium();
        const carrinho = new CarrinhoBuilder()
            .comUser(usuarioPremium)
            .comItens([
                new Item('Notebook', 120),
                new Item('Mouse', 80)
            ])
            .build();
        const gatewayStub = {
            cobrar: jest.fn().mockResolvedValue({ success: true })
        };
        const pedidoSalvo = {
            id: 42,
            carrinho,
            totalFinal: 180,
            status: 'PROCESSADO'
        };
        const repositoryStub = {
            salvar: jest.fn().mockResolvedValue(pedidoSalvo)
        };
        const emailMock = {
            enviarEmail: jest.fn().mockResolvedValue(undefined)
        };
        const checkoutService = new CheckoutService(
            gatewayStub,
            repositoryStub,
            emailMock
        );

        // Act
        const pedido = await checkoutService.processarPedido(
            carrinho,
            'cartao-premium'
        );

        // Assert
        expect(pedido).toBe(pedidoSalvo);
        expect(pedido.totalFinal).toBe(180);
        expect(gatewayStub.cobrar).toHaveBeenCalledWith(
            180,
            'cartao-premium'
        );
        expect(repositoryStub.salvar).toHaveBeenCalledTimes(1);
        expect(emailMock.enviarEmail).toHaveBeenCalledTimes(1);
        expect(emailMock.enviarEmail).toHaveBeenCalledWith(
            'premium@email.com',
            'Seu Pedido foi Aprovado!',
            'Pedido 42 no valor de R$180'
        );
    });
});

describe('quando um cliente Padrao finaliza a compra', () => {
    test('retorna o pedido salvo com o total integral', async () => {
        // Arrange
        const usuarioPadrao = UserMother.umUsuarioPadrao();
        const carrinho = new CarrinhoBuilder()
            .comUser(usuarioPadrao)
            .comItens([new Item('Livro', 100)])
            .build();
        const gatewayStub = {
            cobrar: jest.fn().mockResolvedValue({ success: true })
        };
        const pedidoSalvo = {
            id: 43,
            carrinho,
            totalFinal: 100,
            status: 'PROCESSADO'
        };
        const repositoryStub = {
            salvar: jest.fn().mockResolvedValue(pedidoSalvo)
        };
        const emailStub = {
            enviarEmail: jest.fn().mockResolvedValue(undefined)
        };
        const checkoutService = new CheckoutService(
            gatewayStub,
            repositoryStub,
            emailStub
        );

        // Act
        const pedido = await checkoutService.processarPedido(
            carrinho,
            'cartao-padrao'
        );

        // Assert
        expect(pedido).toBe(pedidoSalvo);
        expect(pedido.totalFinal).toBe(100);
        expect(gatewayStub.cobrar).toHaveBeenCalledWith(
            100,
            'cartao-padrao'
        );
    });
});
