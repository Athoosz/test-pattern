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
